import type { Technique } from '@/lib/types';
import type { WizardState } from './types';

// Calculate match score for a technique based on wizard answers
export function calculateMatchScore(
  technique: Technique,
  state: WizardState
): number {
  let score = 0;
  let maxScore = 0;

  // Check each answer in the path
  for (const pathItem of state.path) {
    maxScore += 100;
    const points = scorePathItem(technique, pathItem);
    score += points;
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

// Score individual path item
function scorePathItem(
  technique: Technique,
  pathItem: { question: string; answer: string | string[] }
): number {
  if (pathItem.question === 'assurance-goal') {
    return scoreAssuranceGoal(technique, pathItem.answer);
  }
  if (pathItem.question === 'model-type') {
    return scoreModelType(technique, pathItem.answer as string);
  }
  if (pathItem.question === 'lifecycle-stage') {
    return scoreLifecycleStage(technique, pathItem.answer);
  }
  if (pathItem.question === 'technique-type') {
    return scoreTechniqueType(technique, pathItem.answer as string);
  }
  return 0;
}

function scoreAssuranceGoal(
  technique: Technique,
  answer: string | string[]
): number {
  const answers = Array.isArray(answer) ? answer : [answer];
  return answers.some((goal) => technique.assurance_goals?.includes(goal))
    ? 100
    : 0;
}

function scoreModelType(technique: Technique, answer: string): number {
  return answer === 'agnostic' || hasModelMatch(technique, answer) ? 100 : 0;
}

function scoreLifecycleStage(
  technique: Technique,
  answer: string | string[]
): number {
  const answers = Array.isArray(answer) ? answer : [answer];
  return answers.includes('not-sure') || hasLifecycleMatch(technique, answers)
    ? 100
    : 0;
}

function scoreTechniqueType(technique: Technique, answer: string): number {
  return answer === 'not-sure' || hasTechniqueTypeMatch(technique, answer)
    ? 100
    : 0;
}

// Check if technique matches model type
function hasModelMatch(technique: Technique, modelType: string): boolean {
  const modelTags =
    technique.tags?.filter((tag) => tag.startsWith('applicable-models/')) || [];

  if (modelType === 'neural-network') {
    return modelTags.some((tag) =>
      ['neural-network', 'cnn', 'rnn', 'transformer'].some((type) =>
        tag.includes(type)
      )
    );
  }

  if (modelType === 'traditional') {
    return modelTags.some((tag) =>
      ['tree-based', 'linear', 'logistic-regression', 'ensemble'].some((type) =>
        tag.includes(type)
      )
    );
  }

  return (
    modelTags.some((tag) => tag.includes(modelType)) ||
    modelTags.some((tag) => tag.includes('agnostic'))
  );
}

// Check if technique matches lifecycle stage
function hasLifecycleMatch(technique: Technique, stages: string[]): boolean {
  const lifecycleTags =
    technique.tags?.filter((tag) => tag.startsWith('lifecycle-stage/')) || [];

  return stages.some((stage) =>
    lifecycleTags.some((tag) => tag.includes(stage))
  );
}

// Check if technique matches technique type
function hasTechniqueTypeMatch(technique: Technique, type: string): boolean {
  const typeTags =
    technique.tags?.filter((tag) => tag.startsWith('technique-type/')) || [];

  return typeTags.some((tag) => tag.includes(type));
}

// Sort techniques by relevance
export function sortTechniquesByRelevance(
  techniques: Technique[],
  state: WizardState
): Technique[] {
  const techniquesWithScores = techniques.map((technique) => ({
    technique,
    score: calculateMatchScore(technique, state),
  }));

  // Sort by score (highest first)
  techniquesWithScores.sort((a, b) => b.score - a.score);

  return techniquesWithScores.map((item) => item.technique);
}

// Helper function to get label for model type
function getModelTypeLabel(answer: string): string {
  switch (answer) {
    case 'neural-network':
      return 'Neural Networks';
    case 'llm':
      return 'Large Language Models';
    case 'traditional':
      return 'Traditional ML';
    default:
      return answer;
  }
}

// Helper function to get label for lifecycle stage
function getLifecycleStageLabel(stage: string): string {
  switch (stage) {
    case 'planning':
      return 'Planning';
    case 'model-development':
      return 'Development';
    case 'deployment':
      return 'Deployment';
    default:
      return stage;
  }
}

// Helper function to get label for technique type
function getTechniqueTypeLabel(type: string): string {
  switch (type) {
    case 'algorithmic':
      return 'Algorithmic method';
    case 'metric':
      return 'Metric/Measurement';
    case 'process':
      return 'Process/Documentation';
    case 'testing':
      return 'Testing/Validation';
    case 'analysis':
      return 'Analysis/Interpretation';
    default:
      return type;
  }
}

// Get reason why technique matches
export function getMatchReasons(
  technique: Technique,
  state: WizardState
): string[] {
  const reasons: string[] = [];

  for (const pathItem of state.path) {
    const reason = getReasonForPathItem(technique, pathItem);
    if (reason) {
      reasons.push(reason);
    }
  }

  // Add versatility indicator
  const modelAgnostic = technique.tags?.some((tag) =>
    tag.includes('applicable-models/agnostic')
  );
  if (modelAgnostic && !reasons.some((r) => r.includes('model'))) {
    reasons.push('Works across contexts');
  }

  return reasons;
}

// Get reason for individual path item
function getReasonForPathItem(
  technique: Technique,
  pathItem: { question: string; answer: string | string[] }
): string | null {
  if (pathItem.question === 'assurance-goal') {
    return getAssuranceGoalReason(technique, pathItem.answer);
  }
  if (pathItem.question === 'model-type') {
    return getModelTypeReason(technique, pathItem.answer as string);
  }
  if (pathItem.question === 'lifecycle-stage') {
    return getLifecycleStageReason(technique, pathItem.answer);
  }
  if (pathItem.question === 'technique-type') {
    return getTechniqueTypeReason(technique, pathItem.answer as string);
  }
  return null;
}

function getAssuranceGoalReason(
  technique: Technique,
  answer: string | string[]
): string | null {
  const answers = Array.isArray(answer) ? answer : [answer];
  const matchedGoals = answers.filter((goal) =>
    technique.assurance_goals?.includes(goal)
  );
  return matchedGoals.length > 0 ? matchedGoals.join(', ') : null;
}

function getModelTypeReason(
  technique: Technique,
  answer: string
): string | null {
  if (answer === 'agnostic') {
    return 'Works with any model';
  }
  if (hasModelMatch(technique, answer)) {
    return getModelTypeLabel(answer);
  }
  return null;
}

function getLifecycleStageReason(
  technique: Technique,
  answer: string | string[]
): string | null {
  const answers = Array.isArray(answer) ? answer : [answer];
  if (!answers.includes('not-sure') && hasLifecycleMatch(technique, answers)) {
    const stageLabels = answers.map(getLifecycleStageLabel);
    return `${stageLabels.join(', ')} stage`;
  }
  return null;
}

function getTechniqueTypeReason(
  technique: Technique,
  answer: string
): string | null {
  if (answer !== 'not-sure' && hasTechniqueTypeMatch(technique, answer)) {
    return getTechniqueTypeLabel(answer);
  }
  return null;
}

// Check if technique is versatile (works in multiple contexts)
export function isVersatileTechnique(technique: Technique): boolean {
  const modelAgnostic = technique.tags?.some((tag) =>
    tag.includes('applicable-models/agnostic')
  );

  const multipleGoals = (technique.assurance_goals?.length || 0) > 2;

  const multipleLifecycles =
    technique.tags?.filter((tag) => tag.startsWith('lifecycle-stage/'))
      .length || 0;

  return modelAgnostic || multipleGoals || multipleLifecycles > 1;
}
