# Applicable Models Tagging System

## Overview

This document defines the hierarchical tagging system for model applicability in the TEA Techniques database. The system uses three complementary dimensions to classify which types of models each technique can be applied to, enabling precise categorization and effective technique discovery based on model requirements.

## Tag Structure

All applicable-models tags follow the format:
```
applicable-models/[dimension]/[category]/[subcategory]
```

## Three Dimensions of Classification

### 1. Architecture Dimension - MODEL FAMILY

The fundamental architectural pattern or learning paradigm of the model.

#### Model-Agnostic
Techniques that work across all model types without requiring specific architecture.
- `architecture/model-agnostic` - Works with any model type (black-box techniques)

#### Neural Networks
Techniques specific to neural network architectures.
- `architecture/neural-networks` - General neural network techniques
- `architecture/neural-networks/feedforward` - Standard feedforward networks (MLPs)
- `architecture/neural-networks/convolutional` - CNNs and vision models
- `architecture/neural-networks/recurrent` - RNNs, LSTMs, GRUs
- `architecture/neural-networks/transformer` - Transformer-based models
- `architecture/neural-networks/transformer/llm` - Large language models (GPT, BERT, etc.)
- `architecture/neural-networks/generative/gan` - Generative adversarial networks
- `architecture/neural-networks/generative/vae` - Variational autoencoders
- `architecture/neural-networks/generative/diffusion` - Diffusion models
- `architecture/neural-networks/graph` - Graph neural networks

#### Tree-Based Models
Techniques for tree-based algorithms.
- `architecture/tree-based/decision-trees` - Single decision trees
- `architecture/tree-based/random-forests` - Random forest ensembles
- `architecture/tree-based/gradient-boosting` - XGBoost, LightGBM, CatBoost

#### Linear Models
Techniques for linear and generalized linear models.
- `architecture/linear-models/regression` - Linear regression
- `architecture/linear-models/logistic` - Logistic regression
- `architecture/linear-models/regularized` - Lasso, Ridge, Elastic Net
- `architecture/linear-models/gam` - Generalized Additive Models

#### Instance-Based Models
Techniques for instance or example-based learning.
- `architecture/instance-based/knn` - k-Nearest Neighbors
- `architecture/instance-based/case-based` - Case-based reasoning systems
- `architecture/instance-based/prototype` - Prototype-based models

#### Probabilistic Models
Techniques for explicitly probabilistic models.
- `architecture/probabilistic/bayesian-networks` - Bayesian belief networks
- `architecture/probabilistic/gaussian-processes` - GP models
- `architecture/probabilistic/hmm` - Hidden Markov Models
- `architecture/probabilistic/mixture-models` - GMMs and similar

#### Kernel Methods
Techniques for kernel-based models.
- `architecture/kernel-methods/svm` - Support Vector Machines
- `architecture/kernel-methods/kernel-regression` - Kernel ridge regression

#### Ensemble Methods
Techniques specific to ensemble approaches.
- `architecture/ensemble/bagging` - Bootstrap aggregating
- `architecture/ensemble/boosting` - AdaBoost and variants
- `architecture/ensemble/stacking` - Meta-learning ensembles

#### Rule-Based Models
Techniques for rule-based and logic systems.
- `architecture/rule-based/decision-rules` - IF-THEN rule systems
- `architecture/rule-based/fuzzy-logic` - Fuzzy rule systems

### 2. Paradigm Dimension - COMPUTATIONAL APPROACH

The computational paradigm or learning approach used by the model.

- `paradigm/parametric` - Models with fixed number of parameters
- `paradigm/non-parametric` - Models where complexity grows with data
- `paradigm/discriminative` - Models that learn decision boundaries directly
- `paradigm/generative` - Models that learn data distributions
- `paradigm/supervised` - Requires labeled training data
- `paradigm/unsupervised` - Works with unlabeled data
- `paradigm/reinforcement` - RL-based models and agents
- `paradigm/online-learning` - Models that update incrementally
- `paradigm/meta-learning` - Models that learn to learn

### 3. Requirements Dimension - TECHNICAL PREREQUISITES

Technical requirements or access levels needed for the technique to work.

- `requirements/gradient-access` - Needs access to model gradients
- `requirements/model-internals` - Needs access to weights, neurons, or internal representations
- `requirements/training-data` - Needs access to original training dataset
- `requirements/architecture-specific` - Requires specific architectural components
- `requirements/white-box` - Full model transparency required
- `requirements/gray-box` - Partial model access sufficient
- `requirements/black-box` - Only input-output access needed
- `requirements/differentiable` - Model must be differentiable
- `requirements/probabilistic-output` - Model must provide probability distributions
- `requirements/structured-output` - Works only with structured predictions

## Tagging Guidelines

### Multiple Tags Per Technique

Techniques should receive tags from multiple dimensions when applicable:
- Architecture tags: Usually 1-3 tags (e.g., model-agnostic OR specific architectures)
- Paradigm tags: 0-2 tags when relevant to technique applicability
- Requirements tags: 1-3 tags to specify technical prerequisites

### Special Cases

#### Model-Agnostic Techniques
For truly model-agnostic techniques:
```
applicable-models/architecture/model-agnostic
applicable-models/requirements/black-box
```

#### Multi-Architecture Techniques
For techniques that work across multiple (but not all) architectures:
```
applicable-models/architecture/neural-networks
applicable-models/architecture/tree-based
applicable-models/requirements/white-box
```

### Example Tagging

**SHAP (Universal version):**
```
applicable-models/architecture/model-agnostic
applicable-models/requirements/black-box
```

**GradCAM:**
```
applicable-models/architecture/neural-networks/convolutional
applicable-models/requirements/gradient-access
applicable-models/requirements/architecture-specific
```

**Attention Visualization:**
```
applicable-models/architecture/neural-networks/transformer
applicable-models/requirements/model-internals
applicable-models/requirements/architecture-specific
```

**Random Forest Feature Importance:**
```
applicable-models/architecture/tree-based/random-forests
applicable-models/paradigm/supervised
applicable-models/requirements/white-box
```

**Influence Functions:**
```
applicable-models/architecture/neural-networks
applicable-models/paradigm/parametric
applicable-models/requirements/gradient-access
applicable-models/requirements/training-data
```

## Decision Criteria

When tagging a technique for model applicability, consider:

1. **Architecture Compatibility**: What model families can use this technique?
2. **Paradigm Alignment**: Does the technique require specific learning paradigms?
3. **Technical Requirements**: What level of model access or capabilities are needed?
4. **Generalizability**: Can this extend to related architectures?

## Tag Validation Rules

1. Every technique must have at least one architecture tag
2. Model-agnostic should not be combined with specific architecture subtypes
3. Requirements tags should align with architecture choices
4. Paradigm tags are optional but recommended for clarity
5. All tags must be lowercase with hyphens (no underscores or spaces)
6. Subcategories should only be used when the parent category doesn't apply

## Migration from Legacy Tags

Legacy tag mappings for consistency:
- `agnostic` → `architecture/model-agnostic`
- `neural-network` → `architecture/neural-networks`
- `cnn` → `architecture/neural-networks/convolutional`
- `rnn`, `recurrent-neural-network` → `architecture/neural-networks/recurrent`
- `transformer` → `architecture/neural-networks/transformer`
- `llm` → `architecture/neural-networks/transformer/llm`
- `tree-based` → `architecture/tree-based`
- `linear-model`, `linear` → `architecture/linear-models`
- `logistic-regression` → `architecture/linear-models/logistic`
- `gan` → `architecture/neural-networks/generative/gan`
- `gaussian-process` → `architecture/probabilistic/gaussian-processes`
- `gam` → `architecture/linear-models/gam`
- `ensemble` → `architecture/ensemble`
- `probabilistic` → `paradigm/probabilistic`

## Future-Proofing

This system is designed to accommodate emerging model types by:
1. Adding new subcategories under existing architectures
2. Creating new architecture categories as needed
3. Extending paradigm classifications for novel learning approaches
4. Adding requirements as new technical prerequisites emerge

The hierarchical structure ensures backward compatibility while enabling precise classification of new techniques.