// Test fixtures for TEA techniques with realistic domain data
import type { Technique } from '../../lib/types'

export const mockAssuranceGoals = [
  { id: 1, name: 'Explainability', description: 'Techniques for making AI decisions interpretable' },
  { id: 2, name: 'Fairness', description: 'Techniques for ensuring equitable AI outcomes' },
  { id: 3, name: 'Privacy', description: 'Techniques for protecting data privacy in AI systems' },
  { id: 4, name: 'Reliability', description: 'Techniques for ensuring consistent AI performance' },
  { id: 5, name: 'Safety', description: 'Techniques for preventing harmful AI behavior' },
  { id: 6, name: 'Transparency', description: 'Techniques for making AI processes visible' },
]

export const mockTags = [
  { id: 1, name: 'model-agnostic' },
  { id: 2, name: 'interpretability' },
  { id: 3, name: 'post-hoc' },
  { id: 4, name: 'feature-attribution' },
  { id: 5, name: 'bias-detection' },
  { id: 6, name: 'privacy-preserving' },
  { id: 7, name: 'robustness-testing' },
  { id: 8, name: 'algorithmic-audit' },
]

export const mockResourceTypes = [
  { id: 1, name: 'Technical Paper', icon: 'technical_paper' },
  { id: 2, name: 'GitHub', icon: 'github' },
  { id: 3, name: 'Documentation', icon: 'documentation' },
  { id: 4, name: 'Tutorial', icon: 'tutorial' },
  { id: 5, name: 'Book', icon: 'book' },
  { id: 6, name: 'Tool', icon: 'tool' },
]

export const mockTechniques = [
  {
    slug: 'shapley-additive-explanations',
    name: 'SHapley Additive exPlanations',
    acronym: 'SHAP',
    description: 'SHAP explains model predictions by quantifying how much each input feature contributes to the outcome. It assigns an importance score to every feature, indicating whether it pushes the prediction towards or away from the average. The method systematically evaluates how predictions change as features are included or excluded, drawing on game theory concepts to ensure a fair distribution of contributions.',
    complexity_rating: 3,
    computational_cost_rating: 2,
    assurance_goals: [mockAssuranceGoals[0], mockAssuranceGoals[1]], // Explainability, Fairness
    tags: [mockTags[0], mockTags[1], mockTags[3]], // model-agnostic, interpretability, feature-attribution
    resources: [
      {
        id: 1,
        resource_type: mockResourceTypes[0], // Technical Paper
        title: 'A Unified Approach to Interpreting Model Predictions',
        url: 'https://proceedings.neurips.cc/paper/2017/hash/8a20a8621978632d76c43dfd28b67767-Abstract.html',
        description: 'Original SHAP paper introducing the unified framework for feature attribution',
        authors: 'Scott Lundberg, Su-In Lee',
        publication_date: '2017-12-04'
      },
      {
        id: 2,
        resource_type: mockResourceTypes[1], // GitHub
        title: 'SHAP (SHapley Additive exPlanations)',
        url: 'https://github.com/slundberg/shap',
        description: 'Official SHAP library implementation in Python',
        authors: 'Scott Lundberg',
        publication_date: '2018-01-01'
      }
    ],
    example_use_cases: [
      {
        id: 1,
        description: 'Analyzing a customer churn prediction model to understand why a specific high-value customer was flagged as likely to leave, revealing that recent support ticket interactions and declining purchase frequency were the main drivers.',
        assurance_goal: mockAssuranceGoals[0] // Explainability
      },
      {
        id: 2,
        description: 'Auditing a loan approval model by comparing SHAP values for applicants from different demographic groups, ensuring that protected characteristics like race or gender do not have an undue influence on credit decisions.',
        assurance_goal: mockAssuranceGoals[1] // Fairness
      }
    ],
    limitations: [
      {
        id: 1,
        description: 'Assumes feature independence, which can produce misleading explanations when features are highly correlated, as the model may attribute importance to features that are merely proxies for others.'
      },
      {
        id: 2,
        description: 'Computationally expensive for models with many features or large datasets, as the number of required predictions grows exponentially with the number of features.'
      }
    ],
    related_techniques: []
  },
  {
    slug: 'local-interpretable-model-agnostic-explanations',
    name: 'Local Interpretable Model-agnostic Explanations',
    acronym: 'LIME',
    description: 'LIME explains individual predictions by learning a local interpretable model around the prediction. It perturbs the input data and observes the changes in predictions to understand which features are most important for a specific decision. The technique is model-agnostic, meaning it can explain any machine learning classifier.',
    complexity_rating: 2,
    computational_cost_rating: 2,
    assurance_goals: [mockAssuranceGoals[0], mockAssuranceGoals[5]], // Explainability, Transparency
    tags: [mockTags[0], mockTags[1], mockTags[2]], // model-agnostic, interpretability, post-hoc
    resources: [
      {
        id: 3,
        resource_type: mockResourceTypes[0], // Technical Paper
        title: '"Why Should I Trust You?": Explaining the Predictions of Any Classifier',
        url: 'https://arxiv.org/abs/1602.04938',
        description: 'Original LIME paper introducing model-agnostic local explanations',
        authors: 'Marco Tulio Ribeiro, Sameer Singh, Carlos Guestrin',
        publication_date: '2016-02-16'
      }
    ],
    example_use_cases: [
      {
        id: 3,
        description: 'Explaining why a medical diagnosis model classified a particular X-ray as showing signs of pneumonia, highlighting the specific regions and features that influenced the decision.',
        assurance_goal: mockAssuranceGoals[0] // Explainability
      }
    ],
    limitations: [
      {
        id: 3,
        description: 'Local explanations may not be representative of the global model behavior, potentially missing important patterns that occur in other regions of the feature space.'
      }
    ],
    related_techniques: ['shapley-additive-explanations'] // Related to SHAP
  },
  {
    slug: 'differential-privacy',
    name: 'Differential Privacy',
    acronym: '',
    description: 'Differential privacy provides a mathematical framework for measuring and controlling privacy loss when analyzing datasets. It ensures that the inclusion or exclusion of any single individual\'s data does not significantly affect the outcome of any analysis, providing strong privacy guarantees.',
    complexity_rating: 4,
    computational_cost_rating: 3,
    assurance_goals: [mockAssuranceGoals[2]], // Privacy
    tags: [mockTags[5]], // privacy-preserving
    resources: [
      {
        id: 4,
        resource_type: mockResourceTypes[0], // Technical Paper
        title: 'Differential Privacy',
        url: 'https://www.microsoft.com/en-us/research/publication/differential-privacy/',
        description: 'Foundational paper on differential privacy by Cynthia Dwork',
        authors: 'Cynthia Dwork',
        publication_date: '2006-07-01'
      }
    ],
    example_use_cases: [
      {
        id: 4,
        description: 'Training a machine learning model on sensitive medical data while ensuring that individual patient records cannot be reconstructed or inferred from the trained model.',
        assurance_goal: mockAssuranceGoals[2] // Privacy
      }
    ],
    limitations: [
      {
        id: 4,
        description: 'Adding noise to preserve privacy can reduce the accuracy and utility of the resulting analysis or model predictions.'
      }
    ],
    related_techniques: []
  },
  {
    slug: 'minimal',
    name: 'Minimal Technique',
    acronym: '',
    description: 'A minimal technique for testing purposes',
    complexity_rating: 1,
    computational_cost_rating: 1,
    assurance_goals: [mockAssuranceGoals[0]], // Explainability
    tags: [mockTags[0]], // model-agnostic
    resources: [],
    example_use_cases: [],
    limitations: [],
    related_techniques: []
  }
]

export const mockTechniquesList = {
  count: mockTechniques.length,
  next: null,
  previous: null,
  results: mockTechniques
}

// Edge case techniques for testing robustness
export const mockEdgeCaseTechniques = [
  {
    slug: 'technique-with-very-long-name-that-might-cause-layout-issues',
    name: 'Technique with Very Long Name That Might Cause Layout Issues in UI Components When Displayed',
    acronym: '',
    description: 'A' + 'very '.repeat(200) + 'long description that tests how components handle extremely lengthy text content and whether proper truncation or wrapping occurs.',
    complexity_rating: 5,
    computational_cost_rating: 5,
    assurance_goals: mockAssuranceGoals,
    tags: mockTags,
    resources: [],
    example_use_cases: [],
    limitations: [],
    related_techniques: []
  },
  {
    slug: 'technique-with-special-characters',
    name: 'Technique with Special Characters: αβγδε & émojis 🤖📊',
    acronym: '',
    description: 'This technique tests handling of unicode characters, special symbols, and emojis in the interface.',
    complexity_rating: 1,
    computational_cost_rating: 1,
    assurance_goals: [mockAssuranceGoals[0]],
    tags: [mockTags[0]],
    resources: [],
    example_use_cases: [],
    limitations: [],
    related_techniques: []
  }
]

// Minimal technique for testing empty states
export const mockEmptyTechnique = {
  slug: '',
  name: '',
  acronym: '',
  description: '',
  complexity_rating: 1,
  computational_cost_rating: 1,
  assurance_goals: [],
  tags: [],
  resources: [],
  example_use_cases: [],
  limitations: [],
  related_techniques: []
}

// Factory functions for generating test data
export const createMockTechnique = (overrides: Partial<Technique> = {}): Technique => ({
  ...mockTechniques[0],
  ...overrides,
  slug: overrides.slug || `test-technique-${Math.floor(Math.random() * 10000)}`, // Ensure unique slug
} as Technique)

export const createMockTechniquesList = (techniques = mockTechniques, pagination = {}) => ({
  count: techniques.length,
  next: null,
  previous: null,
  results: techniques,
  ...pagination
})

// API response builders for different scenarios
export const buildSuccessResponse = <T = unknown>(data: T) => ({
  status: 200,
  json: async () => data,
  ok: true,
})

export const buildErrorResponse = (status: number, message: string) => ({
  status,
  json: async () => ({ error: message }),
  ok: false,
})

export const buildLoadingState = <T = unknown>() => ({
  isLoading: true,
  data: undefined,
  error: null,
}) as { isLoading: boolean; data: T | undefined; error: string | null }

export const buildSuccessState = <T = unknown>(data: T) => ({
  isLoading: false,
  data,
  error: null,
})

export const buildErrorState = <T = unknown>(error: string) => ({
  isLoading: false,
  data: undefined,
  error,
}) as { isLoading: boolean; data: T | undefined; error: string }