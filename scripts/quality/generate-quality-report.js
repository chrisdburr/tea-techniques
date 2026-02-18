#!/usr/bin/env node

/**
 * TEA Techniques Quality Report Generator
 *
 * Analyses techniques.json and produces a structured quality report with:
 * - Tag coverage analysis (universal, goal-conditional, statistical outliers)
 * - Dataset summary statistics
 * - Cross-reference validation
 * - Completeness scoring
 *
 * Usage:
 *   node scripts/quality/generate-quality-report.js
 *   node scripts/quality/generate-quality-report.js --output reports/quality-report.json
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';

import {
  COMPLETENESS_WEIGHTS,
  GOAL_CONDITIONAL_RULES,
  MIN_PEER_GROUP_SIZE,
  OUTLIER_THRESHOLD,
  REQUIRE_GOAL_BASE_TAG,
  REQUIRED_SUBTAG_RULES,
  SCORE_THRESHOLDS,
  SHOULD_RULE_WEIGHT,
  UNIVERSAL_TAG_CATEGORIES,
} from './quality-rules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..', '..');
const dataDir = path.join(rootDir, 'public', 'data');
const techniquesPath = path.join(dataDir, 'techniques.json');

// Top-level regex constants
const TRAILING_SLASH_RE = /\/$/;
const WHITESPACE_RE = /\s+/g;

// Custom logger to handle console usage
const logger = {
  info: (message) => {
    // biome-ignore lint/suspicious/noConsole: CLI tool needs console output
    console.error(message);
  },
  error: (message) => {
    // biome-ignore lint/suspicious/noConsole: CLI tool needs console output
    console.error(message);
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip trailing slash from a string. */
function stripTrailingSlash(str) {
  return str.replace(TRAILING_SLASH_RE, '');
}

/** Convert goal name to slug. */
function goalToSlug(goal) {
  return goal.toLowerCase().replace(WHITESPACE_RE, '-');
}

/** Check if a technique has at least one tag matching a prefix. */
function hasTagPrefix(technique, prefix) {
  return (technique.tags || []).some((tag) => tag.startsWith(prefix));
}

/** Check if a technique has at least one tag in a given top-level category. */
function hasTagCategory(technique, category) {
  return hasTagPrefix(technique, `${category}/`);
}

/** Get all tag categories present on a technique. */
function getTagCategories(technique) {
  const categories = new Set();
  for (const tag of technique.tags || []) {
    categories.add(tag.split('/')[0]);
  }
  return categories;
}

/** Round a number to a given number of decimal places. */
function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// ---------------------------------------------------------------------------
// Module A: Tag Coverage Analysis
// ---------------------------------------------------------------------------

/** Check universal category presence for a single technique. */
function getMissingUniversalCategories(technique) {
  const missing = [];
  for (const category of UNIVERSAL_TAG_CATEGORIES) {
    if (!hasTagCategory(technique, category)) {
      missing.push(category);
    }
  }
  return missing;
}

/** Check subtag rules for a single technique. */
function getMissingSubtags(technique) {
  const missing = [];
  for (const [category, requiredPrefixes] of Object.entries(
    REQUIRED_SUBTAG_RULES
  )) {
    if (hasTagCategory(technique, category)) {
      for (const prefix of requiredPrefixes) {
        if (!hasTagPrefix(technique, prefix)) {
          missing.push(stripTrailingSlash(prefix));
        }
      }
    }
  }
  return missing;
}

function analyseUniversalGaps(techniques) {
  const gaps = [];

  for (const technique of techniques) {
    const missingCategories = getMissingUniversalCategories(technique);
    const missingSubtags = getMissingSubtags(technique);

    // Merge subtag gaps, avoiding duplicates
    for (const label of missingSubtags) {
      if (!missingCategories.includes(label)) {
        missingCategories.push(label);
      }
    }

    if (missingCategories.length > 0) {
      gaps.push({
        slug: technique.slug,
        name: technique.name,
        missing_categories: missingCategories,
      });
    }
  }

  return gaps;
}

/** Check goal-conditional rules for a single technique and goal. */
function getGoalConditionalGapsForGoal(technique, goal) {
  const results = [];
  const rules = GOAL_CONDITIONAL_RULES[goal];
  if (!rules) {
    return results;
  }

  // Check "must" rules
  const mustMissing = rules.must.filter(
    (prefix) => !hasTagPrefix(technique, prefix)
  );
  if (mustMissing.length > 0) {
    results.push({
      slug: technique.slug,
      name: technique.name,
      goal,
      missing: mustMissing.map(stripTrailingSlash),
      level: 'must',
    });
  }

  // Check "should" rules
  const shouldMissing = rules.should.filter(
    (prefix) => !hasTagPrefix(technique, prefix)
  );
  if (shouldMissing.length > 0) {
    results.push({
      slug: technique.slug,
      name: technique.name,
      goal,
      missing: shouldMissing.map(stripTrailingSlash),
      level: 'should',
    });
  }

  // Check base assurance-goal-category tag
  if (REQUIRE_GOAL_BASE_TAG) {
    const basePrefix = `assurance-goal-category/${goalToSlug(goal)}`;
    if (!hasTagPrefix(technique, basePrefix)) {
      results.push({
        slug: technique.slug,
        name: technique.name,
        goal,
        missing: [basePrefix],
        level: 'must',
      });
    }
  }

  return results;
}

function analyseGoalConditionalGaps(techniques) {
  const gaps = [];

  for (const technique of techniques) {
    for (const goal of technique.assurance_goals || []) {
      gaps.push(...getGoalConditionalGapsForGoal(technique, goal));
    }
  }

  return gaps;
}

/** Build peer groups keyed by primary (first) assurance goal. */
function buildPeerGroups(techniques) {
  const groups = {};
  for (const technique of techniques) {
    const primaryGoal = (technique.assurance_goals || [])[0];
    if (!primaryGoal) {
      continue;
    }
    if (!groups[primaryGoal]) {
      groups[primaryGoal] = [];
    }
    groups[primaryGoal].push(technique);
  }
  return groups;
}

/** Compute tag category coverage counts for a peer group. */
function computeCategoryCoverage(peers, allCategories) {
  const counts = {};
  for (const cat of allCategories) {
    counts[cat] = 0;
  }
  for (const peer of peers) {
    for (const cat of getTagCategories(peer)) {
      counts[cat]++;
    }
  }
  return counts;
}

/** Find outliers within a single peer group. */
function findOutliersInGroup(goal, peers, categoryCounts) {
  const outliers = [];
  for (const technique of peers) {
    const presentCategories = getTagCategories(technique);

    for (const [cat, count] of Object.entries(categoryCounts)) {
      const coveragePct = count / peers.length;
      if (coveragePct >= OUTLIER_THRESHOLD && !presentCategories.has(cat)) {
        outliers.push({
          slug: technique.slug,
          name: technique.name,
          goal,
          missing_tag_category: cat,
          peer_coverage_pct: round(coveragePct * 100),
        });
      }
    }
  }
  return outliers;
}

function analyseStatisticalOutliers(techniques) {
  const peerGroups = buildPeerGroups(techniques);

  // Collect all tag categories across dataset
  const allCategories = new Set();
  for (const technique of techniques) {
    for (const cat of getTagCategories(technique)) {
      allCategories.add(cat);
    }
  }

  const outliers = [];
  for (const [goal, peers] of Object.entries(peerGroups)) {
    if (peers.length < MIN_PEER_GROUP_SIZE) {
      continue;
    }
    const categoryCounts = computeCategoryCoverage(peers, allCategories);
    outliers.push(...findOutliersInGroup(goal, peers, categoryCounts));
  }

  return outliers;
}

// ---------------------------------------------------------------------------
// Module B: Dataset Summary Statistics
// ---------------------------------------------------------------------------

function computeSummary(techniques, completenessScores) {
  const techniquesByGoal = {};
  let totalTags = 0;

  for (const technique of techniques) {
    totalTags += (technique.tags || []).length;
    for (const goal of technique.assurance_goals || []) {
      techniquesByGoal[goal] = (techniquesByGoal[goal] || 0) + 1;
    }
  }

  const scores = completenessScores.map((s) => s.score);
  const avgScore =
    scores.length > 0
      ? round(scores.reduce((a, b) => a + b, 0) / scores.length, 1)
      : 0;

  const techniquesWithIssues = completenessScores.filter(
    (s) => s.issues.length > 0
  ).length;
  const totalIssues = completenessScores.reduce(
    (sum, s) => sum + s.issues.length,
    0
  );

  return {
    total_techniques: techniques.length,
    techniques_by_goal: techniquesByGoal,
    avg_tags_per_technique: round(totalTags / techniques.length, 1),
    avg_completeness_score: avgScore,
    techniques_with_issues: techniquesWithIssues,
    total_issues: totalIssues,
  };
}

// ---------------------------------------------------------------------------
// Module C: Cross-Reference Validation
// ---------------------------------------------------------------------------

/** Build adjacency map and collect invalid slug references. */
function buildAdjacencyAndInvalids(techniques, slugSet) {
  const adjacency = {};
  const invalidSlugs = [];
  const incomingCounts = {};

  for (const slug of slugSet) {
    incomingCounts[slug] = 0;
  }

  for (const technique of techniques) {
    const related = technique.related_techniques || [];
    adjacency[technique.slug] = new Set(related);

    const invalid = related.filter((r) => !slugSet.has(r));
    if (invalid.length > 0) {
      invalidSlugs.push({
        slug: technique.slug,
        invalid_related: invalid,
      });
    }

    for (const r of related) {
      if (slugSet.has(r)) {
        incomingCounts[r]++;
      }
    }
  }

  return { adjacency, invalidSlugs, incomingCounts };
}

/** Check a single pair for asymmetry and return a result or null. */
function checkPairAsymmetry(source, target, adjacency) {
  const sourceListsTarget = adjacency[source]?.has(target);
  const targetListsSource = adjacency[target]?.has(source);

  if (sourceListsTarget && !targetListsSource) {
    return { source, target, direction: 'a_lists_b_but_not_reverse' };
  }
  if (!sourceListsTarget && targetListsSource) {
    return {
      source: target,
      target: source,
      direction: 'a_lists_b_but_not_reverse',
    };
  }
  return null;
}

/** Find asymmetric relationships from the adjacency map. */
function findAsymmetricRelationships(techniques, slugSet, adjacency) {
  const asymmetric = [];
  const seen = new Set();

  for (const technique of techniques) {
    const source = technique.slug;
    for (const target of technique.related_techniques || []) {
      if (!slugSet.has(target)) {
        continue;
      }

      const pairId = [source, target].sort().join('|');
      if (seen.has(pairId)) {
        continue;
      }
      seen.add(pairId);

      const result = checkPairAsymmetry(source, target, adjacency);
      if (result) {
        asymmetric.push(result);
      }
    }
  }

  return asymmetric;
}

function validateCrossReferences(techniques) {
  const slugSet = new Set(techniques.map((t) => t.slug));
  const { adjacency, invalidSlugs, incomingCounts } = buildAdjacencyAndInvalids(
    techniques,
    slugSet
  );

  const asymmetric = findAsymmetricRelationships(
    techniques,
    slugSet,
    adjacency
  );

  const orphans = Object.entries(incomingCounts)
    .filter(([, count]) => count === 0)
    .map(([slug]) => slug)
    .sort();

  return {
    invalid_slugs: invalidSlugs,
    asymmetric_relationships: asymmetric,
    orphan_techniques: orphans,
  };
}

// ---------------------------------------------------------------------------
// Module D: Completeness Scoring
// ---------------------------------------------------------------------------

/** Count present universal categories for a technique. */
function countUniversalPresent(technique) {
  let count = 0;
  for (const category of UNIVERSAL_TAG_CATEGORIES) {
    if (hasTagCategory(technique, category)) {
      count++;
    }
  }
  return count;
}

/** Count required/present subtag rules for a technique. */
function countSubtagCoverage(technique) {
  let required = 0;
  let present = 0;
  for (const [category, requiredPrefixes] of Object.entries(
    REQUIRED_SUBTAG_RULES
  )) {
    if (hasTagCategory(technique, category)) {
      for (const prefix of requiredPrefixes) {
        required++;
        if (hasTagPrefix(technique, prefix)) {
          present++;
        }
      }
    }
  }
  return { required, present };
}

/** Count required/present goal-conditional must rules for a technique. */
function countGoalMustCoverage(technique) {
  let required = 0;
  let present = 0;
  for (const goal of technique.assurance_goals || []) {
    const rules = GOAL_CONDITIONAL_RULES[goal];
    if (!rules) {
      continue;
    }
    for (const prefix of rules.must) {
      required++;
      if (hasTagPrefix(technique, prefix)) {
        present++;
      }
    }
  }
  return { required, present };
}

/** Count required/present goal-conditional should rules (partial weight). */
function countGoalShouldCoverage(technique) {
  let required = 0;
  let present = 0;
  for (const goal of technique.assurance_goals || []) {
    const rules = GOAL_CONDITIONAL_RULES[goal];
    if (!rules) {
      continue;
    }
    for (const prefix of rules.should) {
      required += SHOULD_RULE_WEIGHT;
      if (hasTagPrefix(technique, prefix)) {
        present += SHOULD_RULE_WEIGHT;
      }
    }
  }
  return { required, present };
}

/** Count universal + subtag + goal-conditional required/present tags. */
function countTagCoverageParts(technique) {
  const subtag = countSubtagCoverage(technique);
  const goalMust = countGoalMustCoverage(technique);
  const goalShould = countGoalShouldCoverage(technique);

  return {
    requiredCount:
      UNIVERSAL_TAG_CATEGORIES.length +
      subtag.required +
      goalMust.required +
      goalShould.required,
    presentCount:
      countUniversalPresent(technique) +
      subtag.present +
      goalMust.present +
      goalShould.present,
  };
}

function scoreTagCoverage(technique) {
  const { requiredCount, presentCount } = countTagCoverageParts(technique);
  return requiredCount > 0 ? presentCount / requiredCount : 1;
}

function scoreDescriptionQuality(technique) {
  const length = (technique.description || '').length;
  const { min_length, full_score_length } = SCORE_THRESHOLDS.description;

  if (length >= full_score_length) {
    return 1;
  }
  if (length >= min_length) {
    return 0.5;
  }
  return 0;
}

function scoreUseCases(technique) {
  const goals = technique.assurance_goals || [];
  const useCases = technique.example_use_cases || [];

  if (goals.length === 0) {
    return useCases.length > 0 ? 1 : 0;
  }

  // General techniques have goal-agnostic use cases with specific goal labels
  // — having any use cases counts as full coverage
  if (goals.includes('General')) {
    return useCases.length > 0 ? 1 : 0;
  }

  const goalsWithUseCase = new Set(useCases.map((uc) => uc.goal));
  const covered = goals.filter((g) => goalsWithUseCase.has(g)).length;

  return covered / goals.length;
}

function scoreLimitations(technique) {
  const count = (technique.limitations || []).length;
  const { full_score_count } = SCORE_THRESHOLDS.limitations;

  if (count >= full_score_count) {
    return 1;
  }
  if (count === 1) {
    return 0.5;
  }
  return 0;
}

function scoreResources(technique) {
  const count = (technique.resources || []).length;
  const { full_score_count } = SCORE_THRESHOLDS.resources;

  if (count >= full_score_count) {
    return 1;
  }
  if (count > 0) {
    return round(count / full_score_count);
  }
  return 0;
}

function scoreRelatedTechniques(technique, slugSet) {
  const related = (technique.related_techniques || []).filter((r) =>
    slugSet.has(r)
  );
  const { full_score_count } = SCORE_THRESHOLDS.related_techniques;

  if (related.length >= full_score_count) {
    return 1;
  }
  if (related.length > 0) {
    return round(related.length / full_score_count);
  }
  return 0;
}

function scoreGoalTagDepth(technique) {
  const goals = technique.assurance_goals || [];
  if (goals.length === 0) {
    return 1;
  }

  const { min_depth } = SCORE_THRESHOLDS.goal_tag_depth;
  let goalsWithDepth = 0;

  for (const goal of goals) {
    // General goal has no deep taxonomy — exempt from depth-3 requirement
    if (goal === 'General') {
      goalsWithDepth++;
      continue;
    }
    const prefix = `assurance-goal-category/${goalToSlug(goal)}`;
    const hasDeepTag = (technique.tags || []).some((tag) => {
      if (!tag.startsWith(prefix)) {
        return false;
      }
      return tag.split('/').length >= min_depth;
    });
    if (hasDeepTag) {
      goalsWithDepth++;
    }
  }

  return goalsWithDepth / goals.length;
}

/** Get issues for missing universal tag categories. */
function getUniversalCategoryIssues(technique) {
  const issues = [];
  for (const category of UNIVERSAL_TAG_CATEGORIES) {
    if (!hasTagCategory(technique, category)) {
      issues.push(`Missing ${category} tag`);
    }
  }
  return issues;
}

/** Get issues for missing required subtags. */
function getSubtagIssues(technique) {
  const issues = [];
  for (const [category, requiredPrefixes] of Object.entries(
    REQUIRED_SUBTAG_RULES
  )) {
    if (hasTagCategory(technique, category)) {
      for (const prefix of requiredPrefixes) {
        if (!hasTagPrefix(technique, prefix)) {
          issues.push(`Missing ${stripTrailingSlash(prefix)} subtag`);
        }
      }
    }
  }
  return issues;
}

/** Get issues for missing goal-conditional must tags. */
function getGoalMustIssues(technique) {
  const issues = [];
  for (const goal of technique.assurance_goals || []) {
    const rules = GOAL_CONDITIONAL_RULES[goal];
    if (!rules) {
      continue;
    }
    for (const prefix of rules.must) {
      if (!hasTagPrefix(technique, prefix)) {
        issues.push(
          `${goal}: missing required ${stripTrailingSlash(prefix)} tag`
        );
      }
    }
  }
  return issues;
}

/** Collect tag-related issues for a technique. */
function collectTagIssues(technique) {
  return [
    ...getUniversalCategoryIssues(technique),
    ...getSubtagIssues(technique),
    ...getGoalMustIssues(technique),
  ];
}

/** Get use-case-related issues for a technique. */
function getUseCaseIssues(technique) {
  const goals = technique.assurance_goals || [];
  const useCases = technique.example_use_cases || [];

  if (useCases.length === 0) {
    return ['No example use cases'];
  }

  // General techniques have use cases with specific goal labels — skip goal matching
  if (goals.includes('General')) {
    return [];
  }

  const goalsWithUseCase = new Set(useCases.map((uc) => uc.goal));
  const missing = goals.filter((g) => !goalsWithUseCase.has(g));

  if (missing.length > 0) {
    return [`Missing use cases for: ${missing.join(', ')}`];
  }
  return [];
}

/** Collect content-related issues for a technique. */
function collectContentIssues(technique, breakdown, slugSet) {
  const issues = [];

  if (breakdown.description_quality < 1) {
    const length = (technique.description || '').length;
    issues.push(`Short description (${length} chars)`);
  }

  if (breakdown.use_cases < 1) {
    issues.push(...getUseCaseIssues(technique));
  }

  const limitCount = (technique.limitations || []).length;
  if (limitCount === 0) {
    issues.push('No limitations listed');
  } else if (limitCount === 1) {
    issues.push('Only 1 limitation');
  }

  const resourceCount = (technique.resources || []).length;
  if (resourceCount < SCORE_THRESHOLDS.resources.full_score_count) {
    issues.push(
      `Only ${resourceCount} resource${resourceCount === 1 ? '' : 's'}`
    );
  }

  const validRelated = (technique.related_techniques || []).filter((r) =>
    slugSet.has(r)
  );
  if (
    validRelated.length < SCORE_THRESHOLDS.related_techniques.full_score_count
  ) {
    issues.push(`Only ${validRelated.length} valid related techniques`);
  }

  if (breakdown.goal_tag_depth < 1) {
    issues.push('Missing depth-3+ assurance-goal-category tags for some goals');
  }

  return issues;
}

function computeCompletenessScores(techniques) {
  const slugSet = new Set(techniques.map((t) => t.slug));
  const scores = [];

  for (const technique of techniques) {
    const breakdown = {
      tag_coverage: round(scoreTagCoverage(technique)),
      description_quality: round(scoreDescriptionQuality(technique)),
      use_cases: round(scoreUseCases(technique)),
      limitations: round(scoreLimitations(technique)),
      resources: round(scoreResources(technique)),
      related_techniques: round(scoreRelatedTechniques(technique, slugSet)),
      goal_tag_depth: round(scoreGoalTagDepth(technique)),
    };

    const score = round(
      Object.entries(COMPLETENESS_WEIGHTS).reduce(
        (sum, [component, weight]) => sum + breakdown[component] * weight * 100,
        0
      ),
      1
    );

    const tagIssues = collectTagIssues(technique);
    const contentIssues = collectContentIssues(technique, breakdown, slugSet);

    scores.push({
      slug: technique.slug,
      name: technique.name,
      score,
      breakdown,
      issues: [...tagIssues, ...contentIssues],
    });
  }

  // Sort worst-first (ascending score)
  scores.sort((a, b) => a.score - b.score);

  return scores;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  logger.info(chalk.blue('\n📊 Generating TEA Techniques Quality Report...\n'));

  // Load techniques data
  let techniques;
  try {
    const raw = await fs.readFile(techniquesPath, 'utf-8');
    techniques = JSON.parse(raw);
  } catch (error) {
    logger.error(chalk.red(`Failed to load techniques.json: ${error.message}`));
    process.exit(1);
  }

  logger.info(`  Loaded ${techniques.length} techniques`);

  // Collect all unique tags
  const allTags = new Set();
  for (const t of techniques) {
    for (const tag of t.tags || []) {
      allTags.add(tag);
    }
  }

  // Run analyses
  logger.info('  Analysing tag coverage...');
  const universalGaps = analyseUniversalGaps(techniques);
  const goalConditionalGaps = analyseGoalConditionalGaps(techniques);
  const statisticalOutliers = analyseStatisticalOutliers(techniques);

  logger.info('  Validating cross-references...');
  const crossReferences = validateCrossReferences(techniques);

  logger.info('  Computing completeness scores...');
  const completenessScores = computeCompletenessScores(techniques);

  logger.info('  Computing summary...');
  const summary = computeSummary(techniques, completenessScores);

  // Assemble report
  const report = {
    generated_at: new Date().toISOString(),
    dataset_version: {
      technique_count: techniques.length,
      tag_count: allTags.size,
    },
    summary,
    tag_coverage: {
      universal_gaps: universalGaps,
      goal_conditional_gaps: goalConditionalGaps,
      statistical_outliers: statisticalOutliers,
    },
    cross_references: crossReferences,
    completeness_scores: completenessScores,
  };

  // Output
  const args = process.argv.slice(2);
  const outputIdx = args.indexOf('--output');

  if (outputIdx !== -1 && args[outputIdx + 1]) {
    const outputPath = path.resolve(args[outputIdx + 1]);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
    logger.info(chalk.green(`\n✅ Report written to ${outputPath}`));
  } else {
    // Write JSON to stdout (logging goes to stderr)
    // biome-ignore lint/suspicious/noConsole: stdout output for piping
    console.log(JSON.stringify(report, null, 2));
  }

  // Print summary to stderr
  logger.info(chalk.blue('\n📋 Summary:'));
  logger.info(`  Techniques: ${summary.total_techniques}`);
  logger.info(
    `  Avg completeness score: ${summary.avg_completeness_score}/100`
  );
  logger.info(`  Techniques with issues: ${summary.techniques_with_issues}`);
  logger.info(`  Total issues: ${summary.total_issues}`);
  logger.info(`  Universal gaps: ${universalGaps.length}`);
  logger.info(`  Goal-conditional gaps: ${goalConditionalGaps.length}`);
  logger.info(`  Statistical outliers: ${statisticalOutliers.length}`);
  logger.info(`  Invalid cross-refs: ${crossReferences.invalid_slugs.length}`);
  logger.info(
    `  Asymmetric relationships: ${crossReferences.asymmetric_relationships.length}`
  );
  logger.info(
    `  Orphan techniques: ${crossReferences.orphan_techniques.length}`
  );

  // Lowest scoring techniques
  const bottom5 = completenessScores.slice(0, 5);
  logger.info(chalk.yellow('\n⚠️  Lowest scoring techniques:'));
  for (const t of bottom5) {
    logger.info(`  ${t.score.toFixed(1)} - ${t.name} (${t.slug})`);
  }

  logger.info(chalk.green('\n✅ Quality report generation complete.\n'));
}

main();
