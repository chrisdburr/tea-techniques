import type { WizardConfig } from './types';

export const wizardConfig: WizardConfig = {
  entryPoints: [
    {
      id: 'by-goal',
      title: 'I know my assurance goal',
      description: 'Start with what you want to achieve',
      icon: '🎯',
      startQuestion: 'assurance-goal',
    },
    {
      id: 'by-model',
      title: 'I know my model type',
      description: 'Start with your AI/ML model',
      icon: '🤖',
      startQuestion: 'model-type',
    },
    {
      id: 'by-technique',
      title: 'I know the technique type',
      description: 'Start with the kind of method you need',
      icon: '🔧',
      startQuestion: 'technique-type',
    },
  ],

  questions: {
    'assurance-goal': {
      id: 'assurance-goal',
      text: "What's your primary assurance goal?",
      helpText:
        'Select the main objective you want to achieve with your AI system',
      helpItems: {
        Explainability: 'Understanding how AI makes decisions',
        Fairness: 'Ensuring equitable treatment across groups',
        Privacy: 'Protecting personal information',
        Reliability: 'Consistent and predictable performance',
        Safety: 'Preventing harm and ensuring safe operation',
        Security: 'Protection from attacks and vulnerabilities',
        Transparency: 'Being open about capabilities and limitations',
      },
      type: 'single',
      filterTag: 'assurance_goals',
      options: 'dynamic',
      allowNotSure: false,
    },

    'assurance-subcategory': {
      id: 'assurance-subcategory',
      text: 'Any specific aspect of {previousAnswer}?',
      helpText: 'Optional: Narrow down to a specific area',
      type: 'multi',
      filterTag: 'assurance-goal-category',
      options: 'dynamic',
      allowNotSure: true,
      notSureLabel: 'Show all aspects',
      conditional: true,
      minOptionsForDisplay: 3,
    },

    'model-type': {
      id: 'model-type',
      text: 'What type of model are you using?',
      helpText: 'Select the AI/ML model architecture',
      helpItems: {
        'Neural Networks': 'Deep learning models (CNN, RNN, Transformer)',
        'Large Language Models': 'GPT, Claude, Gemini, LLaMA, etc.',
        'Traditional ML': 'Random forests, SVM, linear models',
        'Probabilistic Models': 'Bayesian networks, Gaussian processes',
        'Other Models': 'GANs, reinforcement learning, etc.',
      },
      type: 'single',
      filterTag: 'applicable-models',
      options: [
        {
          value: 'neural-network',
          label: 'Neural Networks',
          description: 'CNN, RNN, Transformer',
        },
        {
          value: 'llm',
          label: 'Large Language Models',
          description: 'GPT, Claude, etc.',
        },
        {
          value: 'traditional',
          label: 'Traditional ML',
          description: 'Tree-based, linear models',
        },
        { value: 'probabilistic', label: 'Probabilistic Models' },
        { value: 'other', label: 'Other specific models' },
        { value: 'agnostic', label: "Not sure / Doesn't matter" },
      ],
      allowNotSure: false,
    },

    'lifecycle-stage': {
      id: 'lifecycle-stage',
      text: 'What lifecycle stage are you in?',
      helpText:
        'You can select multiple stages if your project spans several phases',
      helpItems: {
        Planning: 'Requirements gathering, risk assessment, system design',
        Development: 'Model training, validation, testing, iteration',
        Deployment: 'Production monitoring, maintenance, updates',
      },
      type: 'multi',
      filterTag: 'lifecycle-stage',
      options: [
        {
          value: 'planning',
          label: 'Planning & Design',
          description: 'Pre-development phase',
        },
        {
          value: 'model-development',
          label: 'Model Development',
          description: 'Building and training',
        },
        {
          value: 'deployment',
          label: 'Deployment & Operations',
          description: 'Production phase',
        },
      ],
      allowNotSure: true,
      notSureLabel: 'Multiple stages / Not sure',
    },

    'technique-type': {
      id: 'technique-type',
      text: 'What type of technique are you looking for?',
      helpText: 'The kind of method or approach you need',
      type: 'single',
      filterTag: 'technique-type',
      options: [
        {
          value: 'algorithmic',
          label: 'Algorithmic/Computational',
          description: 'Code-based methods',
        },
        {
          value: 'metric',
          label: 'Metrics & Measurements',
          description: 'Quantitative evaluation',
        },
        {
          value: 'process',
          label: 'Documentation & Processes',
          description: 'Procedural approaches',
        },
        {
          value: 'testing',
          label: 'Testing & Validation',
          description: 'Quality assurance',
        },
        {
          value: 'analysis',
          label: 'Analysis & Interpretation',
          description: 'Understanding results',
        },
      ],
      allowNotSure: true,
      notSureLabel: 'Any type',
    },

    'expertise-level': {
      id: 'expertise-level',
      text: 'What expertise is available?',
      helpText: 'The technical knowledge available in your team',
      type: 'single',
      filterTag: 'expertise-needed',
      options: [
        { value: 'ml-expertise', label: 'Machine Learning expertise' },
        { value: 'statistics', label: 'Statistical knowledge' },
        { value: 'software-engineering', label: 'Software engineering' },
        { value: 'domain', label: 'Domain expertise only' },
        { value: 'minimal', label: 'Limited technical expertise' },
      ],
      allowNotSure: true,
      notSureLabel: 'Mixed expertise',
      conditional: true,
      skipIfUniform: true,
    },

    'data-availability': {
      id: 'data-availability',
      text: 'What data do you have access to?',
      helpText: 'The type and amount of data available',
      type: 'single',
      filterTag: 'data-requirements',
      options: [
        { value: 'training-data', label: 'Training data only' },
        { value: 'test-data', label: 'Separate test data' },
        { value: 'synthetic', label: 'Can generate synthetic data' },
        { value: 'limited', label: 'Limited data available' },
        { value: 'no-special', label: 'No special requirements' },
      ],
      allowNotSure: true,
      notSureLabel: 'Various data types',
      conditional: true,
      skipIfUniform: true,
    },
  },

  flows: {
    'by-goal': {
      id: 'by-goal',
      questions: [
        'assurance-goal',
        'assurance-subcategory',
        'lifecycle-stage',
        'model-type',
        'expertise-level',
      ],
      adaptiveOrdering: true,
    },
    'by-model': {
      id: 'by-model',
      questions: [
        'model-type',
        'assurance-goal',
        'lifecycle-stage',
        'technique-type',
      ],
      adaptiveOrdering: true,
    },
    'by-technique': {
      id: 'by-technique',
      questions: [
        'technique-type',
        'assurance-goal',
        'model-type',
        'lifecycle-stage',
      ],
      adaptiveOrdering: false,
    },
  },

  resultsConfig: {
    minResults: 3,
    idealResults: 8,
    maxResults: 15,
  },
};

// Helper functions for dynamic options
export function getQuestionOptions(
  questionId: string,
  _context?: { previousAnswer?: string }
) {
  const question = wizardConfig.questions[questionId];
  if (!question) {
    return [];
  }

  if (question.options === 'dynamic') {
    // These will be populated from actual data
    switch (questionId) {
      case 'assurance-goal':
        // Will be populated from getAssuranceGoals()
        return [];
      case 'assurance-subcategory':
        // Will be populated based on selected goal
        return [];
      default:
        return [];
    }
  }

  return question.options || [];
}

// Help text formatting
export function getFormattedHelpText(
  questionId: string,
  context?: { previousAnswer?: string }
) {
  const question = wizardConfig.questions[questionId];
  if (!question) {
    return null;
  }

  let text = question.text;
  if (context?.previousAnswer && text.includes('{previousAnswer}')) {
    text = text.replace('{previousAnswer}', context.previousAnswer);
  }

  return {
    text,
    helpText: question.helpText,
    helpItems: question.helpItems,
  };
}
