/**
 * Tag definitions for TEA Techniques
 * This file provides descriptions for all tags used in the system.
 * Definitions are sourced from TAG-DEFINITIONS.md and generated for missing tags.
 */

export const tagDefinitions: Record<string, string> = {
  // Category-level definitions
  'applicable-models':
    'Types of machine learning models the technique can be applied to',
  'lifecycle-stage':
    'Stages of the AI system development lifecycle where the technique is applicable',
  'expertise-needed':
    'Type of knowledge or expertise required to apply the technique effectively',
  'technique-type': 'Fundamental nature and approach of the technique',
  'evidence-type':
    'Type of output or evidential artifact produced by the technique',
  'data-requirements':
    'Specific data needs or dependencies for applying the technique',
  'data-type': 'Types of data the technique is designed for or applicable to',
  'assurance-goal-category':
    'Primary responsible AI goal that the technique helps achieve',
  'explanatory-scope':
    'Whether the explanation is instance-specific (local) or model-wide (global)',
  'fairness-approach':
    'Underlying approach to fairness for fairness-related techniques',

  // Applicable Models
  'applicable-models/agnostic':
    'Techniques that work with any type of machine learning model',
  'applicable-models/cnn':
    'Techniques specifically designed for Convolutional Neural Networks',
  'applicable-models/ensemble':
    'Techniques for models that combine multiple base learners',
  'applicable-models/gam': 'Techniques for Generalized Additive Models',
  'applicable-models/gan': 'Techniques for Generative Adversarial Networks',
  'applicable-models/gaussian-process':
    'Techniques for Gaussian Process models',
  'applicable-models/linear':
    'Techniques for linear models including linear regression',
  'applicable-models/linear-model':
    'Techniques for linear and logistic regression models',
  'applicable-models/llm': 'Techniques designed for Large Language Models',
  'applicable-models/logistic-regression':
    'Techniques specifically for logistic regression models',
  'applicable-models/neural-network':
    'Techniques for general neural network architectures',
  'applicable-models/probabilistic':
    'Techniques for probabilistic and Bayesian models',
  'applicable-models/recurrent-neural-network':
    'Techniques for RNN architectures',
  'applicable-models/rnn':
    'Techniques for Recurrent Neural Networks including LSTM and GRU',
  'applicable-models/transformer':
    'Techniques for transformer-based architectures',
  'applicable-models/tree-based':
    'Techniques for decision trees, random forests, and gradient boosting',

  // Lifecycle Stage
  'lifecycle-stage/project-design':
    'Techniques used during initial project planning and design',
  'lifecycle-stage/project-planning':
    'Techniques for early project planning and requirement gathering',
  'lifecycle-stage/data-handling':
    'Techniques for data collection, preparation, and preprocessing',
  'lifecycle-stage/data-collection':
    'Techniques specific to gathering and collecting data',
  'lifecycle-stage/data-collection/data-augmentation':
    'Techniques for expanding or enhancing datasets',
  'lifecycle-stage/data-collection/data-preprocessing':
    'Techniques for cleaning and preparing collected data',
  'lifecycle-stage/data-handling/collection':
    'Techniques for the data collection phase',
  'lifecycle-stage/data-handling/preparation':
    'Techniques for preparing data for model training',
  'lifecycle-stage/data-handling/preprocessing':
    'Techniques for data transformation and cleaning',
  'lifecycle-stage/model-development':
    'Techniques used during model building and training',
  'lifecycle-stage/model-development/training':
    'Techniques applied during the model training process',
  'lifecycle-stage/model-development/testing':
    'Techniques for testing model performance',
  'lifecycle-stage/model-development/fine-tuning':
    'Techniques for optimizing model parameters',
  'lifecycle-stage/model-evaluation':
    'Techniques for assessing model performance and behavior',
  'lifecycle-stage/model-optimization':
    'Techniques for improving model efficiency and performance',
  'lifecycle-stage/deployment': 'Techniques for deploying models to production',
  'lifecycle-stage/system-deployment-and-use':
    'Techniques for deployed systems in production',
  'lifecycle-stage/system-deployment-and-use/monitoring':
    'Techniques for monitoring deployed models',
  'lifecycle-stage/system-deployment-and-use/auditing':
    'Techniques for auditing deployed systems',
  'lifecycle-stage/monitoring': 'Techniques for continuous model monitoring',
  'lifecycle-stage/post-deployment':
    'Techniques applied after model deployment',
  'lifecycle-stage/post-processing': 'Techniques for processing model outputs',
  'lifecycle-stage/testing': 'Techniques for testing models and systems',

  // Expertise Needed
  'expertise-needed/statistics':
    'Requires knowledge of statistical methods and analysis',
  'expertise-needed/causal-inference':
    'Requires understanding of causal relationships and inference',
  'expertise-needed/domain-knowledge':
    'Requires expertise in the specific application domain',
  'expertise-needed/domain-expertise':
    'Requires deep understanding of the problem domain',
  'expertise-needed/ml-engineering':
    'Requires machine learning engineering skills',
  'expertise-needed/software-engineering':
    'Requires general programming and system design skills',
  'expertise-needed/legal':
    'Requires understanding of legal frameworks and regulations',
  'expertise-needed/ethics':
    'Requires knowledge of ethical principles and frameworks',
  'expertise-needed/regulatory-compliance':
    'Requires understanding of regulatory requirements',
  'expertise-needed/cryptography':
    'Requires cryptographic knowledge for privacy-preserving techniques',
  'expertise-needed/security':
    'Requires security expertise for threat analysis and mitigation',
  'expertise-needed/safety-engineering':
    'Requires safety engineering principles and practices',
  'expertise-needed/linguistics':
    'Requires linguistic knowledge for language-based techniques',
  'expertise-needed/experimental-design':
    'Requires knowledge of experimental design and testing',
  'expertise-needed/stakeholder-engagement':
    'Requires skills in stakeholder communication and engagement',
  'expertise-needed/low':
    'Can be applied with basic technical knowledge and standard tools',

  // Evidence Type
  'evidence-type/quantitative-metric':
    'Produces numerical scores, coefficients, or measurements',
  'evidence-type/visualization':
    'Creates visual representations like plots, charts, or heatmaps',
  'evidence-type/visualisation':
    'Creates visual representations of data or model behavior',
  'evidence-type/qualitative-report':
    'Generates textual analysis or narrative documentation',
  'evidence-type/structured-output':
    'Produces structured data like rules or decision trees',
  'evidence-type/fairness-metric':
    'Generates specific metrics related to fairness assessment',
  'evidence-type/privacy-guarantee':
    'Provides formal privacy guarantees like differential privacy',
  'evidence-type/documentation':
    'Creates standardized documentation like model cards',
  'evidence-type/prediction-interval':
    'Produces uncertainty ranges for predictions',
  'evidence-type/boundary-analysis':
    'Analyzes decision boundaries and edge cases',
  'evidence-type/causal-analysis':
    'Provides insights into causal relationships',
  'evidence-type/dataset-analysis':
    'Analyzes characteristics and quality of datasets',
  'evidence-type/synthetic-data': 'Generates synthetic or simulated data',
  'evidence-type/governance-framework':
    'Establishes governance structures and processes',

  // Data Requirements
  'data-requirements/labelled-data':
    'Requires datasets with ground truth labels',
  'data-requirements/no-special-requirements':
    'Works with standard inputs without special requirements',
  'data-requirements/access-to-model-internals':
    'Needs access to model gradients, weights, or activations',
  'data-requirements/access-to-training-data':
    'Requires the original training dataset',
  'data-requirements/validation-set': 'Needs a separate validation dataset',
  'data-requirements/calibration-set':
    'Requires a calibration dataset for adjustment',
  'data-requirements/sensitive-attributes':
    'Needs data labeled with protected attributes',
  'data-requirements/causal-graph':
    'Requires a predefined causal structure or graph',
  'data-requirements/reference-dataset':
    'Needs a baseline or reference dataset for comparison',
  'data-requirements/pre-trained-model':
    'Requires an existing trained model as input',
  'data-requirements/prediction-probabilities':
    'Needs probabilistic predictions from the model',
  'data-requirements/test-scenarios':
    'Requires predefined test cases or scenarios',

  // Data Type
  'data-type/any': 'Applicable across all data types',
  'data-type/tabular': 'Designed for structured tabular data',
  'data-type/text': 'Designed for text and natural language data',
  'data-type/image': 'Designed for image and visual data',

  // Technique Type
  'technique-type/algorithmic': 'A specific algorithm or computational method',
  'technique-type/procedural': 'A defined process or series of steps',
  'technique-type/documentation': 'A template or standard for documentation',
  'technique-type/metric': 'A specific measure or calculation method',
  'technique-type/process': 'An organizational or workflow approach',
  'technique-type/visualization': 'A method focused on visual representation',
  'technique-type/experimental':
    'Techniques based on experimental testing and validation',
  'technique-type/gradient-based':
    'Techniques that utilize gradient information',
  'technique-type/mechanistic-interpretability':
    'Techniques for understanding model mechanisms',
  'technique-type/testing': 'Techniques focused on testing and validation',

  // Assurance Goal Categories
  'assurance-goal-category/explainability':
    'Techniques that help understand model decisions and behavior',
  'assurance-goal-category/explainability/feature-analysis':
    'Analyzes the role and importance of features',
  'assurance-goal-category/explainability/feature-analysis/importance-and-attribution':
    'Attributes model decisions to specific features',
  'assurance-goal-category/fairness':
    'Techniques that assess or improve fairness in AI systems',
  'assurance-goal-category/fairness/group':
    'Focuses on fairness between demographic groups',
  'assurance-goal-category/fairness/group/statistical-parity':
    'Ensures equal outcomes across groups',
  'assurance-goal-category/fairness/causal':
    'Uses causal reasoning to define and ensure fairness',
  'assurance-goal-category/privacy':
    'Techniques that protect data privacy and confidentiality',
  'assurance-goal-category/privacy/formal-guarantee':
    'Provides mathematically proven privacy guarantees',
  'assurance-goal-category/privacy/formal-guarantee/differential-privacy':
    'Implements differential privacy mechanisms',
  'assurance-goal-category/reliability':
    'Techniques that ensure consistent and dependable performance',
  'assurance-goal-category/reliability/uncertainty-quantification':
    'Quantifies prediction uncertainty and confidence',
  'assurance-goal-category/safety':
    'Techniques that prevent harmful or dangerous outcomes',
  'assurance-goal-category/safety/monitoring/anomaly-detection':
    'Detects unusual or potentially unsafe behavior',
  'assurance-goal-category/transparency':
    'Techniques that increase system openness and clarity',
  'assurance-goal-category/transparency/documentation':
    'Creates clear documentation of system behavior',
  'assurance-goal-category/transparency/documentation/model-card':
    'Standardized model documentation format',

  // Explanatory Scope
  'explanatory-scope/local': 'Provides explanations for individual predictions',
  'explanatory-scope/global':
    'Provides explanations for overall model behavior',

  // Fairness Approach
  'fairness-approach/group': 'Focuses on statistical parity between groups',
  'fairness-approach/causal': 'Uses causal models to define fairness',
};
