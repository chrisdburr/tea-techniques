# Explainability Tagging System

## Overview

This document defines the hierarchical tagging system for explainability techniques in the TEA Techniques database. The system uses three complementary dimensions to classify techniques, enabling precise categorization and effective discovery.

## Tag Structure

All explainability tags follow the format:
```
assurance-goal-category/explainability/[dimension]/[category]/[subcategory]
```

## Three Dimensions of Classification

### 1. Method Dimension - HOW the technique works

The primary approach or mechanism used to generate explanations.

#### Attribution Methods
Techniques that assign importance scores to inputs/features.
- `attribution-methods/gradient-based` - Uses gradients/derivatives (e.g., Integrated Gradients, Saliency Maps)
- `attribution-methods/perturbation-based` - Modifies inputs to measure impact (e.g., SHAP, Permutation Importance)
- `attribution-methods/model-specific` - Leverages model structure (e.g., Mean Decrease Impurity for trees)

#### Surrogate Models
Techniques that approximate complex models with interpretable ones.
- `surrogate-models/local-surrogates` - Approximates behavior around specific instances (e.g., LIME)
- `surrogate-models/global-surrogates` - Approximates entire model behavior (e.g., GAMs, Model Distillation)
- `surrogate-models/rule-extraction` - Extracts interpretable rules (e.g., ANCHOR, RuleFit)

#### Visualization Methods
Techniques focused on visual representation of model behavior.
- `visualization-methods/feature-relationships` - Shows feature effects (e.g., PDP, ICE Plots)
- `visualization-methods/attention-patterns` - Displays attention mechanisms (e.g., Attention Visualization)
- `visualization-methods/activation-maps` - Creates visual heatmaps (e.g., Grad-CAM, Saliency Maps)

#### Representation Analysis
Techniques analyzing internal model representations.
- `representation-analysis/dimensionality-reduction` - Reduces complexity for understanding (e.g., PCA, t-SNE)
- `representation-analysis/concept-identification` - Identifies learned concepts (e.g., CAVs, Neuron Activation)
- `representation-analysis/decomposition` - Breaks down predictions into components (e.g., Taylor Decomposition)

#### Instance-Based Methods
Techniques using example-based explanations.
- `instance-based/prototypes` - Uses representative examples (e.g., Prototype & Criticism Models)
- `instance-based/influence-analysis` - Traces impact of training data (e.g., Influence Functions)
- `instance-based/counterfactual` - Shows alternative scenarios (e.g., Contrastive Explanation Method)

#### Uncertainty Analysis
Techniques quantifying model confidence and robustness.
- `uncertainty-analysis/prediction-uncertainty` - Measures confidence (e.g., Monte Carlo Dropout)
- `uncertainty-analysis/sensitivity-testing` - Tests robustness to changes (e.g., Prompt Sensitivity Analysis)

#### Causal Analysis
Techniques examining causal relationships.
- `causal-analysis/mediation-analysis` - Traces causal pathways (e.g., Causal Mediation Analysis)
- `causal-analysis/interaction-effects` - Analyzes feature interactions (e.g., Sobol Indices)

#### Model Simplification
Techniques that create simpler, more interpretable models.
- `model-simplification/pruning` - Removes unnecessary components (e.g., Model Pruning)
- `model-simplification/knowledge-transfer` - Transfers to simpler model (e.g., Model Distillation)

### 2. Target Dimension - WHAT the technique explains

The aspect of model behavior or data that the technique reveals.

- `explains/feature-importance` - Which inputs matter most for predictions
- `explains/decision-boundaries` - How the model separates different outcomes
- `explains/internal-mechanisms` - How the model processes information internally
- `explains/prediction-confidence` - How certain/uncertain the model is
- `explains/data-patterns` - Underlying structures and relationships in data
- `explains/causal-pathways` - How effects propagate through the model

### 3. Property Dimension - QUALITY characteristics

Key properties that characterize the explanation quality or approach.

- `property/completeness` - Attributions fully account for model output
- `property/consistency` - Similar inputs produce similar explanations
- `property/fidelity` - Accurately represents true model behavior
- `property/sparsity` - Focuses on few, most important factors
- `property/causality` - Identifies causal rather than correlational relationships
- `property/comprehensibility` - Produces human-understandable formats
- `property/efficiency` - Computationally efficient to generate
- `property/counterfactual-validity` - Can show what changes would alter outcomes

## Tagging Guidelines

### Multiple Tags Per Technique
Techniques should receive tags from multiple dimensions when applicable:
- Most techniques will have 1-2 method tags
- Most techniques will have 1-2 target tags
- Properties should only be added when they are defining characteristics

### Example Tagging

**SHAP:**
```
assurance-goal-category/explainability/attribution-methods/perturbation-based
assurance-goal-category/explainability/explains/feature-importance
assurance-goal-category/explainability/property/completeness
assurance-goal-category/explainability/property/consistency
```

**LIME:**
```
assurance-goal-category/explainability/surrogate-models/local-surrogates
assurance-goal-category/explainability/explains/feature-importance
assurance-goal-category/explainability/explains/decision-boundaries
assurance-goal-category/explainability/property/fidelity
```

**Grad-CAM:**
```
assurance-goal-category/explainability/visualization-methods/activation-maps
assurance-goal-category/explainability/attribution-methods/gradient-based
assurance-goal-category/explainability/explains/feature-importance
assurance-goal-category/explainability/property/sparsity
assurance-goal-category/explainability/property/efficiency
```

## Decision Criteria

When tagging a technique, consider:

1. **Primary Method**: What is the core algorithmic approach?
2. **Secondary Methods**: Are other methods also employed?
3. **Explanation Output**: What insights does it provide to users?
4. **Defining Properties**: What key characteristics distinguish this technique?

## Tag Validation Rules

1. Every explainability technique must have at least one method tag
2. Every technique should have at least one target tag
3. Property tags are optional but recommended where applicable
4. Tags must follow the exact format and hierarchy defined above
5. All tags must be lowercase with hyphens (no underscores or spaces)