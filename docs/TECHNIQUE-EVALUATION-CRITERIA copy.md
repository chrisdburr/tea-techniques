# Evaluating Techniques for the TEA Techniques Database

## Introduction

This document outlines the criteria used to evaluate and select techniques for inclusion in the Trustworthy and Ethical Assurance (TEA) Techniques database (`techniques.json`). The goal is to create a curated, high-quality resource that helps practitioners build robust assurance cases for their AI systems.

### What is a "Technique" in this Context?

Within this project, a **technique** refers to a specific method, tool, process, algorithm, or approach used to generate an evidential artefact. The evidential artefact produced by applying these techniques is intended to be used within an argument-based assurance framework to support claims about the system's trustworthiness and ethical behaviour—in accordance with specific goals.

Techniques can range from formal techniques, such as statistical tests and specific algorithms (e.g. LIME or SHAP), to non-formal and procedural techniques, such as documentation standards (e.g. Model Cards) or organisational processes (e.g Red Teaming).

To help understand better what a technique is, it's also useful to distinguish between:

-   **Principles:** In the context of argument-based assurance, principles are closely aligned with the top-level goals (e.g., Demographic Parity as a goal for a Fairness Case, Differential Privacy as a guarantee in a Privacy Case). Principles are more abstract than techniques, and may not be directly measurable or actionable. They often serve as guiding concepts or objectives for the techniques that follow.
-   **Specific Techniques/Implementations:** Concrete tools or practices used to measure, achieve, or provide evidence for associated principles (e.g., Statistical Parity Difference as a metric for Demographic Parity, DP-SGD as a technique to achieve Differential Privacy).
-   **Tags and Categories:** Additional ways of classifying techniques (e.g., "Fairness-Aware Preprocessing", "Statistical Hypothesis Testing") that may lead to clustering or links between multiple specific techniques.

### Why Have Evaluation Criteria?

Having clear, well-defined criteria for inclusion/exclusion serves several crucial purposes:

1.  **Quality Control:** Ensures that the techniques listed are relevant, credible, and useful for building assurance cases.
2.  **Consistency:** Provides a standardised framework for evaluating diverse techniques, across principles and categories, leading to a more coherent dataset.
3.  **Scope Management:** Helps define the boundaries of the dataset, preventing the inclusion of irrelevant or poorly defined methods or processes.
4.  **User Trust:** Builds confidence for users that the techniques presented have met a certain standard of relevance and utility for TEA purposes.
5.  **Contribution Guidance:** Offers clear guidelines for community members who wish to suggest new techniques for inclusion.

## Evaluation Criteria

The following criteria are used to evaluate techniques for inclusion in the TEA Techniques database:

1. **Relevance to Assurance Goals:**

    - Does the technique directly address one or more core TEA goals (Explainability, Fairness, Privacy, Reliability, Safety, or Transparency)?
    - Can the output of the technique serve as credible evidence for specific assurance claims related to these goals?

2. **Nature of Evidence Provided:**

    - What kind of output does the technique produce (e.g., quantitative metrics, statistical tests, visualisations, counterfactual examples, formal proofs, qualitative reports)?
    - How directly does this output support an argument within an assurance case?

3. **Applicability & Scope:**

    - **Model Applicability:** Is it model-agnostic (`applicable-models/all`) or specific to certain architectures (e.g., `applicable-models/cnn`, `applicable-models/transformer`)?
    - **Data Type:** Is it applicable to specific data types (tabular, text, images, time series)?
    - **Lifecycle Stage:** At which stage of the ML lifecycle is it typically applied (data preparation, training, testing, deployment, monitoring)?
    - **Scope of Explanation/Analysis:** Does it provide local (instance-level) or global (model-level) insights?

These criteria are captured in the dataset using specific tags or fields. For example, tags with the `applicable-models` prefix specify the model types for which the technique is relevant.

4. **Maturity and Validity:**

    - Is the technique well-established in research or practice? Is it peer-reviewed?
    - Is there empirical or theoretical evidence supporting its effectiveness and validity for its stated purpose?
    - Are its underlying assumptions clearly understood?

Fields such as `resources`, `limitations`, and `example use cases` help capture this information.

5. **Practicality & Resource Requirements:**

    - **Complexity:** How difficult is it to understand and implement?
    - **Computational Cost:** How resource-intensive is it to run?
    - **Data Requirements:** Does it have specific requirements regarding data size, format, or labelling?
    - **Expertise Needed:** Does it require specialised knowledge (e.g., statistics, causal inference, specific ML architectures)? If so, who are the target audience or stakeholders?

6. **Actionability:**

    - How easy is it for different stakeholders (developers, auditors, regulators) to understand the technique's output?
    - Can the results be readily translated into actionable steps or specific claims in an assurance case?

Fields such as `resources` and `example use cases` help capture this information.

7. **Limitations and Assumptions:**

    - Are the known limitations, weaknesses, and underlying assumptions well-documented?
    - Understanding these is crucial for building a robust assurance argument that acknowledges potential weaknesses.

8. **Availability of Tooling & Resources:**

    - Are there readily available software libraries, implementations, or detailed tutorials?
    - Good resources increase the likelihood that users can actually apply the technique.

## Summary Table

| Heading                          | Description                                                                                                | Captured in Dataset (via Tags or Fields)                                                                                  |
| :------------------------------- | :--------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **Relevance to Assurance Goals** | Does the technique directly address core TEA goals (Explainability, Fairness, Privacy, Reliability, etc.)? | Yes (`assurance-goal/{goalname}` tag)                                                                                     |
| **Evidence Type**                | What kind of output/evidence does it produce (metrics, visualizations, reports, proofs)?                   | Yes (`evidence-type/{type}` tag)                                                                                          |
| **Applicability & Scope**        | Where does it fit? (Model type, data type, lifecycle stage, local/global analysis).                        | Yes (`applicable-models/{modelname}`, `data-type/{type}`, `lifecycle-stage/{stage}`, `explanatory-scope/{scope}` tags)    |
| **Maturity & Validity**          | Is the technique well-established, peer-reviewed, and demonstrably effective?                              | Implied by existence and quality of `resources`                                                                           |
| **Practicality**                 | What are the implementation complexity, computational cost, data needs, and required expertise?            | Yes (`complexity_rating`, `computational_cost_rating` fields; `data-requirements/{req}`, `expertise-needed/{field}` tags) |
| **Interpretability**             | How easily can the results be understood by stakeholders and used in an argument?                          | Partially (Requires qualitative assessment, potentially informed by `expertise-needed/{field}` tag)                       |
| **Limitations & Assumptions**    | Are the technique's weaknesses, constraints, and necessary assumptions clearly documented?                 | Yes (`limitations` field)                                                                                                 |
| **Tooling & Resources**          | Are implementations, libraries, or detailed guides available?                                              | Yes (`resources` field)                                                                                                   |
