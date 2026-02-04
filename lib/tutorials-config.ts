/**
 * Tutorial configuration for TEA Techniques
 *
 * Maps technique slugs to their tutorial information.
 * Add entries here as tutorials are completed.
 */

export interface TutorialConfig {
  /** Technique slug (must match techniques.json) */
  slug: string;
  /** Tutorial status */
  status: 'available' | 'coming-soon' | 'planned';
  /** Path to notebook file (relative to tutorials/notebooks/) */
  notebookPath: string;
  /** Assurance goal this tutorial primarily demonstrates */
  assuranceGoal: string;
  /** Estimated completion time in minutes */
  estimatedMinutes?: number;
  /** Difficulty level */
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Registry of all technique tutorials
 */
export const tutorialsConfig: TutorialConfig[] = [
  {
    slug: 'shapley-additive-explanations',
    status: 'available',
    notebookPath: 'shap/shap-tutorial.ipynb',
    assuranceGoal: 'Explainability',
    estimatedMinutes: 45,
    difficulty: 'intermediate',
  },
  {
    slug: 'local-interpretable-model-agnostic-explanations',
    status: 'planned',
    notebookPath: 'lime/lime-tutorial.ipynb',
    assuranceGoal: 'Transparency',
    estimatedMinutes: 40,
    difficulty: 'intermediate',
  },
  {
    slug: 'differential-privacy',
    status: 'planned',
    notebookPath: 'differential-privacy/differential-privacy-tutorial.ipynb',
    assuranceGoal: 'Privacy',
    estimatedMinutes: 50,
    difficulty: 'intermediate',
  },
  {
    slug: 'conformal-prediction',
    status: 'planned',
    notebookPath: 'conformal-prediction/conformal-prediction-tutorial.ipynb',
    assuranceGoal: 'Reliability',
    estimatedMinutes: 45,
    difficulty: 'intermediate',
  },
  {
    slug: 'hallucination-detection',
    status: 'planned',
    notebookPath:
      'hallucination-detection/hallucination-detection-tutorial.ipynb',
    assuranceGoal: 'Safety',
    estimatedMinutes: 40,
    difficulty: 'intermediate',
  },
  {
    slug: 'prompt-injection-testing',
    status: 'planned',
    notebookPath:
      'prompt-injection-testing/prompt-injection-testing-tutorial.ipynb',
    assuranceGoal: 'Security',
    estimatedMinutes: 35,
    difficulty: 'beginner',
  },
  {
    slug: 'bootstrapping',
    status: 'planned',
    notebookPath: 'bootstrapping/bootstrapping-tutorial.ipynb',
    assuranceGoal: 'Fairness',
    estimatedMinutes: 30,
    difficulty: 'beginner',
  },
];

/**
 * Get tutorial config for a technique by slug
 */
export function getTutorialConfig(slug: string): TutorialConfig | undefined {
  return tutorialsConfig.find((t) => t.slug === slug);
}

/**
 * Check if a technique has any tutorial (available, coming soon, or planned)
 */
export function hasTutorial(slug: string): boolean {
  return tutorialsConfig.some((t) => t.slug === slug);
}

/**
 * Get all available tutorials
 */
export function getAvailableTutorials(): TutorialConfig[] {
  return tutorialsConfig.filter((t) => t.status === 'available');
}

/**
 * Generate Colab URL for a tutorial
 */
export function getColabUrl(config: TutorialConfig): string {
  const repoBase =
    'https://colab.research.google.com/github/alan-turing-institute/tea-techniques/blob/main/tutorials/notebooks';
  return `${repoBase}/${config.notebookPath}`;
}

/**
 * Generate GitHub URL for a tutorial
 */
export function getGitHubUrl(config: TutorialConfig): string {
  const repoBase =
    'https://github.com/alan-turing-institute/tea-techniques/blob/main/tutorials/notebooks';
  return `${repoBase}/${config.notebookPath}`;
}
