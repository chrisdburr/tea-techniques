# TEA Techniques Tag Definitions and Governance

**Version:** 1.0
**Date:** 2025-04-10

## 1. Introduction

This document defines the structure, prefixes, and common tags used within the `tags` array for techniques in `app/data/json/techniques.json`. Consistent use of these tags is crucial for filtering, analysis, and application usability. This system aims to provide good coverage of technique properties based on the TEA evaluation criteria and the existing dataset, while being flexible enough to evolve.

## 2. Tag Format

Tags follow a hierarchical structure using forward slashes (`/`) as separators and must contain at least one prefix. The format is as follows:

-   **Prefix:** Indicates the broad classification scheme (e.g., `assurance-goal-category`). Prefixes are mandatory.
-   **Tag Content:** Represents the specific content for the tag within the prefix, potentially including sub-topics (e.g., `explainability/feature-analysis/importance-attribution`).

A complete example is `assurance-goal-category/explainability/feature-analysis/importance-attribution`.

All parts of the tag must be **lowercase** and use **hyphens** (`-`) instead of spaces or underscores.

## 3. Defined Prefixes

This section outlines the defined prefixes, derived from core technique properties and evaluation criteria. This list is expected to evolve following the governance plan.

### 3.1. `assurance-goal-category/{goalname}/{category}`

Provides more specific classifications for the assurance goals. This tag replaces the legacy `categories` and `subcategories` fields.

-   **`{goalname}` (Required):**
    -   `explainability`
    -   `fairness`
    -   `privacy`
    *   `reliability`
    *   `safety`
    *   `transparency`
-   **`{category}` (Optional, Hierarchical):** Examples include:
    -   `explainability/feature-analysis/importance-attribution`
    -   `explainability/model-inspection/surrogate-model`
    -   `explainability/example-based/prototype-criticism`
    -   `fairness/group/statistical-parity`
    -   `fairness/individual/consistency`
    -   `fairness/causal`
    -   `privacy/formal-guarantee/differential-privacy`
    -   `reliability/uncertainty-quantification/prediction-interval`
    -   `safety/monitoring/anomaly-detection`
    -   `transparency/documentation/model-card`

_Example:_ `assurance-goal-category/explainability/feature-analysis/importance-attribution`, `assurance-goal-category/fairness/group/statistical-parity`

### 3.2. `applicable-models/{model-type}`

Indicates the types of models to which the technique is applicable. Replaces the `model_dependency` field and uses information from the `applicable_models` list. Techniques can have multiple tags.

-   **`{model-type}` (Required):**
    -   `agnostic` (For model-agnostic techniques)
    -   `neural-network` (General neural networks)
    -   `cnn` (Convolutional Neural Networks)
    -   `rnn` (Recurrent Neural Networks)
    -   `lstm` (Long Short-Term Memory networks)
    -   `transformer` (Transformer architecture)
    -   `llm` (Large Language Models)
    -   `linear-model` (e.g., Linear/Logistic Regression)
    -   `tree-based` (e.g., Decision Trees, Random Forests, Gradient Boosting)
    -   `rule-based` (e.g., Rule lists)
    -   `gan` (Generative Adversarial Networks)
    -   `gam` (Generalized Additive Models)
    -   `bayesian` (Bayesian models)
    -   `vision-model` (Models primarily for image/video)
    -   `nlp-model` (Models primarily for text/language)
    -   `recommender-system`
    -   `causal-model` (Structural Causal Models)
    -   `quantile-regression`
    -   `transfer-learning`

_Example:_ `applicable-models/cnn`, `applicable-models/agnostic`

### 3.3. `lifecycle-stage/{stage}/{sub-stage}`

Indicates the typical project lifecycle stage(s) for application.

-   **`{stage}` (Required):**
    -   `project-design`
    -   `data-handling`
    -   `model-development`
    -   `system-deployment-and-use`
-   **`{sub-stage}` (Optional):**
    -   `data-handling/`: `collection`, `preparation`, `preprocessing`
    -   `model-development/`: `feature-engineering`, `model-selection`, `training`, `testing`, `validation`, `tuning`
    -   `system-deployment-and-use/`: `deployment`, `monitoring`, `auditing`

_Example:_ `lifecycle-stage/model-development/training`, `lifecycle-stage/system-deployment-and-use/monitoring`

### 3.4. `expertise-needed/{field}`

Indicates the type of knowledge or expertise typically required to apply the technique effectively.

-   **`{field}` (Required):**
    -   `statistics`
    -   `causal-inference`
    -   `domain-knowledge` (Specific to the application area)
    -   `ml-engineering` (Model building, training, MLOps)
    -   `software-engineering` (General programming, system integration)
    -   `legal-ethics` (Understanding regulations and ethical principles)
    -   `regulatory-compliance` (Understanding of legal/regulatory frameworks)
    -   `cryptography` (For privacy-preserving techniques like HE)
    -   `security` (For techniques like red teaming)
    -   `user-experience` (For designing interpretable outputs)
    -   `low` (Relatively easy to apply with standard tools)

_Example:_ `expertise-needed/statistics`, `expertise-needed/domain-knowledge`

### 3.5. `evidence-type/{type}`

Indicates the nature of the output or evidential artefact produced by the technique.

-   **`{type}` (Required):**
    -   `quantitative-metric` (Numerical scores, coefficients, ratios)
    -   `visualization` (Plots, charts, heatmaps, attention maps, saliency maps)
    -   `qualitative-report` (Textual analysis, documentation, audit reports)
    -   `statistical-test` (Hypothesis tests, p-values, significance tests)
    -   `structured-output` (Rules, decision trees, counterfactuals, synthetic data)
    -   `feature-importance` (List or ranking of feature influence)
    -   `prediction-interval` (Range for a prediction)
    -   `fairness-metric` (Specific metric related to fairness)
    -   `privacy-guarantee` (e.g., Epsilon value for DP)
    -   `documentation` (e.g., Model Card, Datasheet)

_Example:_ `evidence-type/visualization`, `evidence-type/quantitative-metric`, `evidence-type/qualitative-report`

### 3.6. `data-requirements/{req}`

Indicates specific data needs or dependencies for the technique.

-   **`{req}` (Required):**
    -   `labelled-data` (Requires ground truth labels)
    -   `large-dataset` (Performs better or requires large volumes)
    -   `specific-format` (e.g., Time series, graph structure)
    -   `access-to-training-data` (Needs the original training set)
    -   `access-to-model-internals` (Needs gradients, activations, etc.)
    -   `validation-set` (Requires a separate set for validation)
    -   `calibration-set` (Requires a separate set for calibration)
    -   `sensitive-attributes` (Requires data labelled with protected attributes)
    -   `causal-graph` (Requires a predefined causal structure)
    -   `reference-dataset` (Requires comparison baseline or reference data)
    -   `no-special-requirements` (Works generally with standard inputs)

_Example:_ `data-requirements/labelled-data`, `data-requirements/access-to-model-internals`

### 3.7. `explanatory-scope/{scope}`

Indicates whether the explanation or analysis provided is local (instance-specific) or global (model-wide). Replaces the "Explanatory Scope" attribute.

-   **`{scope}` (Required):**
    -   `local`
    -   `global`

_Example:_ `explanatory-scope/local`

### 3.8. `fairness-approach/{approach}`

Categorizes the underlying approach to fairness if the technique is fairness-related. Replaces the "Fairness Approach" attribute.

-   **`{approach}` (Required for fairness techniques):**
    -   `group` (Focuses on statistical parity between groups)
    -   `individual` (Focuses on treating similar individuals similarly)
    -   `causal` (Uses causal models to define fairness)

_Example:_ `fairness-approach/group`

### 3.9. `data-type/{type}`

Indicates the type(s) of data the technique is primarily designed for or applicable to.

-   **`{type}` (Required):**
    -   `tabular`
    -   `text`
    -   `image`
    -   `time-series` (Temporal or sequential data)
    -   `graph`
    -   `any` (Generally applicable across data types)

_Example:_ `data-type/tabular`, `data-type/text`

### 3.10. `technique-type/{type}`

Categorizes the fundamental nature of the technique itself.

-   **`{type}` (Required):**
    -   `algorithmic` (A specific algorithm or computational method)
    -   `procedural` (A defined process or series of steps)
    -   `documentation` (A template or standard for documenting)
    -   `metric` (A specific measure or calculation)
    -   `process` (An organizational or workflow approach)
    -   `framework` (A broader conceptual approach or system)
    -   `visualization` (A method focused on visual output)

_Example:_ `technique-type/algorithmic`, `technique-type/documentation`

## 4. Governance Plan

This plan outlines how the tag system is maintained and updated.

### 4.1. Principles

-   **Consistency:** Tags should be applied uniformly across all techniques.
-   **Clarity:** Tag definitions must be clear and unambiguous.
-   **Relevance:** Tags should accurately reflect the technique's properties and align with the evaluation criteria.
-   **Evolution:** The tag system should be adaptable to new techniques and evolving concepts in TEA.

### 4.2. Adding/Modifying Tags & Prefixes

1.  **Proposal:** Anyone wishing to add a new tag value, modify an existing one, or propose a new prefix should open a GitHub Issue or Discussion thread outlining the proposal and justification. Reference relevant techniques or evaluation criteria.
2.  **Discussion:** The team discusses the proposal, considering its necessity, clarity, potential overlap with existing tags/prefixes, and impact on consistency. The goal is to reuse existing structures where possible (e.g., adding a sub-topic vs. a new prefix).
3.  **Approval:** Consensus is sought for approval. If approved, proceed to documentation.
4.  **Documentation Update:** A Pull Request (PR) is created to update this document (`docs/TAG-DEFINITIONS.md`) with the new/modified definition(s). This PR must be reviewed and merged before the tag is used in `techniques.json`.

### 4.3. Applying Tags to Techniques

1.  **Mandatory Prefixes:** For each technique, strive to apply at least one tag for _every relevant prefix_ defined in this document (e.g., `applicable-models`, `assurance-goal-category`, `lifecycle-stage`, `technique-type`, `data-type`, `explanatory-scope` should generally always be applicable). Apply others (`fairness-approach`, `expertise-needed`, `evidence-type`, `data-requirements`) where relevant.
2.  **Specificity:** Use the most specific tag available in a hierarchy (e.g., prefer `lifecycle-stage/model-development/training` over just `lifecycle-stage/model-development` if the technique is specific to training). Add broader tags only if the technique genuinely spans the entire category.
3.  **Multiple Tags:** Techniques can and should have multiple tags across different prefixes and within the same prefix where appropriate (e.g., multiple `applicable-models` or `assurance-goal-category` tags).
4.  **Review:** When adding or modifying techniques in `techniques.json`, the associated PR review process must include verification that tags are applied correctly and consistently according to this document.

### 4.4. Maintenance & Validation

1.  **Periodic Review:** The tag system (definitions and usage) should be reviewed periodically (e.g., quarterly or bi-annually) by the core team to ensure it remains relevant, comprehensive, and effective.
2.  **Migration:** Existing fields in `techniques.json` (e.g., `attributes`, `categories`, `subcategories`, `model_dependency`) should be migrated to this tag system. A separate plan or script should manage this transition. Once migration is complete and verified, the old fields can be deprecated or removed.
3.  **Validation (Optional Enhancement):** Consider developing a script (`scripts/validate_tags.py`?) that checks `techniques.json` to ensure all used tags conform to the definitions and structure in this document (valid prefix, valid content if predefined, correct format). This could be run as part of CI/CD or pre-commit hooks.
