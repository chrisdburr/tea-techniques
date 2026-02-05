# Design: AI Agent Improvement Methodology (rlw.4)

> **Status**: Draft for review
> **Issue**: tea-techniques-rlw.4
> **Author**: Claude + Christopher Burr
> **Date**: 2026-02-05

## Overview

This document defines the methodology for an AI-powered enhancement system that
continuously improves the TEA Techniques dataset. The system uses a multi-agent
consensus approach with three evidence-based perspectives to propose changes.

## Design Principles

### Never Complete

The system operates on the principle that **improvement is perpetual**:

- Resources become outdated (links break, newer papers supersede)
- Community norms evolve (what counts as "appropriate complexity" changes)
- New techniques are added requiring full analysis
- Literature landscape shifts (new frameworks, deprecated approaches)
- Tag taxonomy may need expansion as the field evolves

**Implication**: Quality metrics must be designed without hard ceilings. The
report should surface opportunities, not declare completion.

### Multi-Agent Consensus

Tag proposals and significant changes require agreement from a committee of
three specialist agents representing different evidence sources:

| Agent | Perspective | Focus |
|-------|-------------|-------|
| **Academic Researcher** | Literature & theory | Peer-reviewed sources, methodological rigour, citation patterns |
| **Industry Practitioner** | Applied use | Real-world applicability, tooling availability, deployment considerations |
| **Standards Body** | Governance & compliance | Regulatory alignment, audit requirements, documentation standards |

**Consensus rule**: 2/3 agreement required for proposals to proceed.

### Human in the Loop

All changes require human approval. The agent proposes; the human decides.

## Architecture

### Invocation

```bash
# Ad-hoc run
claude -p "/enhance-dataset"

# With specific scope
claude -p "/enhance-dataset --technique shapley-additive-explanations"
claude -p "/enhance-dataset --goal Fairness"
claude -p "/enhance-dataset --worst 10"

# Cron-scheduled (fortnightly, after quality report generation)
claude -p "/enhance-dataset" --agent enhancement-orchestrator
```

### Agent Structure

```
.claude/
├── agents/
│   └── enhance-dataset.md          # Orchestrator agent
├── skills/
│   └── enhancement/
│       ├── academic-perspective.md  # Academic researcher sub-agent
│       ├── practitioner-perspective.md  # Industry practitioner sub-agent
│       └── standards-perspective.md # Standards body sub-agent
└── commands/
    └── enhance-dataset.md          # Slash command entry point
```

### Tool Access

The orchestrator and specialist agents have access to:

**Existing Tools:**
- `Read`, `Write`, `Edit` - File operations
- `Grep`, `Glob` - Codebase search
- `WebSearch`, `WebFetch` - Web research
- `mcp__zotero__*` - Zotero library access
- `mcp__tea-techniques__*` - Knowledge graph queries

**Required New MCPs (or tool configurations):**
- arXiv API access (paper discovery, metadata)
- Semantic Scholar API (citation graphs, influence metrics)
- DOI resolution (link validation, metadata retrieval)

## Workflow

### Phase 1: Assessment

1. **Load quality report** from `reports/quality-report.json`
2. **Parse scope** from command arguments or select based on summary stats:
   - If `--technique <slug>`: Single technique focus
   - If `--goal <goal>`: All techniques for that assurance goal
   - If `--worst N`: Bottom N techniques by completeness score
   - Default: Prioritise by issue density and score
3. **Build work queue** of techniques requiring attention

### Phase 2: Analysis (Per Technique)

For each technique in the work queue:

1. **Load technique data** from `techniques.json`
2. **Load issues** from quality report (tag gaps, cross-ref issues, score breakdown)
3. **Spawn specialist agents** in parallel:
   - Academic Researcher: Searches literature, checks resource validity
   - Industry Practitioner: Checks tooling/library availability, practical applicability
   - Standards Body: Checks alignment with frameworks (ISO, NIST, EU AI Act)
4. **Collect perspectives** - each agent returns structured analysis

### Phase 3: Consensus

For each proposed change:

1. **Aggregate proposals** from all three perspectives
2. **Identify agreements** (2/3 or 3/3 consensus)
3. **Flag disagreements** for human attention
4. **Rank by confidence** (unanimous > majority)

### Phase 4: Proposal Generation

Generate structured proposals with:

```markdown
## Proposed Change: [technique-slug]

### Change Type
- [ ] Tag addition
- [ ] Tag removal
- [ ] Related technique link
- [ ] Resource update
- [ ] Description enhancement
- [ ] Limitation addition
- [ ] New taxonomy value (requires approval)

### Proposal
[Specific change to be made]

### Evidence
- **Academic**: [Citation or reasoning]
- **Practitioner**: [Tooling/applicability evidence]
- **Standards**: [Framework alignment]

### Consensus
- Academic: ✅ Agree / ❌ Disagree / ⚠️ Uncertain
- Practitioner: ✅ Agree / ❌ Disagree / ⚠️ Uncertain
- Standards: ✅ Agree / ❌ Disagree / ⚠️ Uncertain

### Confidence
High / Medium / Low
```

### Phase 5: Application

Upon human approval:

1. **Apply changes** to `techniques.json`
2. **Log decision** to `.enhancement-log.json` (gitignored)
3. **Regenerate derived data** (`pnpm generate-data`)
4. **Verify** with `pnpm type-check && pnpm lint`

## Scoping Strategies

### By Summary Statistics

| Condition | Strategy |
|-----------|----------|
| High issue count (>50) | Focus on worst-N (exploit mode) |
| Moderate issues (20-50) | Mix of worst-N and goal rotation |
| Low issues (<20) | Exploration mode: freshness checks, relationship discovery |
| New technique added | Full analysis pipeline (cold start) |

### Work Limits

To keep PRs reviewable:
- Max 5 techniques per run
- Max 10 changes per technique
- Human can request more with `--batch-size N`

## Exploration Activities

When exploitation opportunities are limited, the system explores:

### 1. Taxonomy Expansion Research

- Query literature for emerging concepts not in current taxonomy
- Propose new tag values with supporting evidence
- Example: "Fairness technique using causal inference not captured by current `fairness-approach` values"

### 2. Resource Freshness Checks

- Validate existing resource URLs (404 detection)
- Check for newer versions of papers (arXiv revisions)
- Find superseding publications via citation graphs
- Check Zotero for newer entries matching technique topics

### 3. Cross-Technique Relationship Discovery

- Use semantic search to find missing `related_techniques` links
- Identify asymmetric relationships (A→B but not B→A)
- Surface orphan techniques (no relationships)
- Propose relationship clusters based on methodology similarity

## Memory and Learning

### Rejection Log

File: `.enhancement-log.json` (gitignored)

```json
{
  "rejections": [
    {
      "date": "2026-02-05",
      "technique": "shapley-additive-explanations",
      "proposal": "Add tag fairness-approach/individual",
      "reason": "User: Technique is goal-agnostic, not fairness-specific",
      "permanent": true
    }
  ],
  "approvals": [
    {
      "date": "2026-02-05",
      "technique": "permutation-importance",
      "change": "Added related_technique: mean-decrease-impurity"
    }
  ]
}
```

### Git History

Primary record of changes. Commit messages should reference:
- Techniques modified
- Change types
- Consensus level

## Quality Metrics: Avoiding Ceilings

Current metrics that can reach 100%:
- Tag coverage (all required categories filled)
- Cross-reference validity (all links valid and symmetric)

Metrics that should drift / have no ceiling:
- **Resource freshness**: Age of cited resources (newer is better, but always aging)
- **Literature coverage**: Ratio of relevant papers in Zotero to papers citing this technique
- **Taxonomy alignment**: How well tags match current literature terminology
- **Peer comparison**: How technique compares to similar techniques (relative, not absolute)

### Proposed: Freshness Decay

Add to quality report:
```json
{
  "resource_freshness": {
    "avg_age_years": 3.2,
    "oldest_resource_years": 8,
    "resources_older_than_5y": 12,
    "freshness_score": 0.72  // Decays over time
  }
}
```

### Proposed: Coverage Drift

Track literature landscape changes:
```json
{
  "literature_coverage": {
    "technique_citations_found": 45,
    "citations_in_zotero": 12,
    "coverage_ratio": 0.27,
    "new_papers_this_quarter": 8
  }
}
```

## Open Questions

1. **MCP Server Dependencies**: Should we require arXiv/Semantic Scholar MCPs, or use WebFetch with API endpoints?

2. **Parallel Execution**: Can specialist agents run in parallel, or must they sequence to share context?

3. **Confidence Calibration**: How do we calibrate agent confidence scores to be meaningful?

4. **Taxonomy Governance**: Who approves new taxonomy values? Just maintainer, or community RFC?

5. **Rate Limiting**: How do we handle API rate limits for literature searches?

## Implementation Phases

### Phase A: Core Infrastructure
- [ ] Create `enhance-dataset.md` orchestrator agent
- [ ] Create three specialist agent skills
- [ ] Create `/enhance-dataset` slash command
- [ ] Implement proposal output format

### Phase B: Specialist Capabilities
- [ ] Academic perspective: Zotero integration, citation search
- [ ] Practitioner perspective: GitHub/PyPI package checks
- [ ] Standards perspective: Framework mapping knowledge

### Phase C: Exploration Features
- [ ] Resource freshness checking
- [ ] Relationship discovery via semantic search
- [ ] Taxonomy gap detection

### Phase D: Metrics Evolution
- [ ] Add freshness decay to quality report
- [ ] Add literature coverage tracking
- [ ] Implement relative peer comparison

## Related Issues

- **rlw.5**: Implement improvement skill
- **rlw.6**: Implement agent configuration and PR workflow
- **c17**: Knowledge graph and MCP server (dependency, complete)
