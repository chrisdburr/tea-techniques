# Evaluating Techniques for the TEA Techniques Database

## Introduction

This document outlines the criteria used to evaluate and select techniques for inclusion in the Trustworthy and Ethical Assurance (TEA) Techniques database (`techniques.json`). The goal is to create a curated, high-quality resource that helps practitioners build robust assurance cases for their AI systems.

### What is a "Technique" in this Context?

Within this project, a **technique** refers to a specific method, tool, process, algorithm, or approach used to generate evidence about the properties of an AI system. These properties align with core TEA goals such as Explainability, Fairness, Privacy, Reliability, Safety, and Transparency. The evidence produced by applying these techniques is intended to be used within an argument-based assurance framework to support claims about the system's trustworthiness and ethical behaviour. Techniques can range from statistical tests and specific algorithms (like LIME or SHAP) to documentation standards (like Model Cards) and organizational processes (like Red Teaming).

It's useful to distinguish between:
*   **Principles/Definitions:** Foundational concepts or goals (e.g., Demographic Parity as a fairness goal, Differential Privacy as a guarantee). These might be included for context but should be clearly identified as such.
*   **Specific Techniques/Implementations:** Concrete methods used to measure, achieve, or provide evidence for those principles (e.g., Statistical Parity Difference as a metric for Demographic Parity, DP-SGD as a technique to achieve Differential Privacy). The database primarily focuses on these specific, actionable techniques.
*   **General Methodologies/Categories:** Broad approaches (e.g., "Fairness-Aware Preprocessing", "Statistical Hypothesis Testing") that encompass multiple specific techniques. These are generally excluded in favour of listing the specific techniques they contain.

### Why Have Evaluation Criteria?

Having clear, well-defined criteria for inclusion serves several crucial purposes:

1.  **Quality Control:** Ensures that the techniques listed are relevant, credible, and useful for building assurance cases.
2.  **Consistency:** Provides a standardized framework for evaluating diverse techniques, leading to a more coherent dataset.
3.  **Scope Management:** Helps define the boundaries of the dataset, preventing the inclusion of irrelevant or poorly defined methods.
4.  **User Trust:** Builds confidence for users that the techniques presented have met a certain standard of relevance and utility for TEA purposes.
5.  **Contribution Guidance:** Offers clear guidelines for community members who wish to suggest new techniques for inclusion.

### Are These Criteria Sufficient and Well-Defined?

The criteria listed below cover key dimensions necessary for evaluating the suitability of a technique for assurance case evidence generation. They address:

*   **Relevance:** Alignment with TEA goals.
*   **Output:** The nature and suitability of the evidence produced.
*   **Context:** Applicability across different models, data, and lifecycle stages.
*   **Credibility:** Maturity, validity, and understanding of assumptions.
*   **Usability:** Practicality, resource needs, and required expertise.
*   **Clarity:** Interpretability of results and documentation of limitations.
*   **Support:** Availability of tools and resources.

While these criteria provide a comprehensive framework, some aspects, particularly "Interpretability & Actionability" and "Nature of Evidence Provided," involve qualitative judgment. Future refinements might involve adding more specific sub-criteria or examples to further guide evaluation. However, they represent a robust and sufficient starting point for curating the initial dataset and guiding its future expansion.

---

# Criteria for TEA Techniques

1. **Relevance to Assurance Goals:**
    
    - Does the technique directly address one or more core TEA goals (Explainability, Fairness, Privacy, Reliability, Safety, Transparency)?
    - Can the output of the technique serve as credible evidence for specific assurance claims related to these goals?

2. **Nature of Evidence Provided:**
    
    - What kind of output does the technique produce (e.g., quantitative metrics, statistical tests, visualisations, counterfactual examples, formal proofs, qualitative reports)?
    - How directly does this output support an argument within an assurance case?

3. **Applicability & Scope:**
    
    - **Model Dependency:** Is it model-agnostic or specific to certain architectures (e.g., Neural Networks, Tree-based models)?
    - **Data Type:** Is it applicable to specific data types (tabular, text, images, time series)?
    - **Lifecycle Stage:** At which stage of the ML lifecycle is it typically applied (data preparation, training, testing, deployment, monitoring)? 
    - **Scope of Explanation/Analysis:** Does it provide local (instance-level) or global (model-level) insights?

4. **Maturity and Validity:**
    
    - Is the technique well-established in research or practice? Is it peer-reviewed?
    - Is there empirical or theoretical evidence supporting its effectiveness and validity for its stated purpose?
    - Are its underlying assumptions clearly understood?

5. **Practicality & Resource Requirements:**
    
    - **Complexity:** How difficult is it to understand and implement?
    - **Computational Cost:** How resource-intensive is it to run?
    - **Data Requirements:** Does it have specific requirements regarding data size, format, or labelling?
    - **Expertise Needed:** Does it require specialised knowledge (e.g., statistics, causal inference, specific ML architectures)? If so, who are the target audience or stakeholders?

6. **Interpretability & Actionability:**
    
    - How easy is it for different stakeholders (developers, auditors, regulators) to understand the technique's output?
    - Can the results be readily translated into actionable steps or specific claims in an assurance case?

7. **Limitations and Assumptions:**
    
    - Are the known limitations, weaknesses, and underlying assumptions well-documented?
    - Understanding these is crucial for building a robust assurance argument that acknowledges potential weaknesses.

8. **Availability of Tooling & Resources:**
    
    - Are there readily available software libraries, implementations, or detailed tutorials?
    - Good resources increase the likelihood that users can actually apply the technique.

## Summary Table

| Heading                          | Description                                                                                                | Captured in Dataset                                          |
| :------------------------------- | :--------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------- | 
| **Relevance to Assurance Goals** | Does the technique directly address core TEA goals (Explainability, Fairness, Privacy, Reliability, etc.)? | Yes (via `assurance_goals` relationship)                     |
| **Evidence Type**                | What kind of output/evidence does it produce (metrics, visualizations, reports, proofs)?                   | Partially (Implied by description and resources)             |
| **Applicability & Scope**        | Where does it fit? (Model type, data type, lifecycle stage, local/global analysis).                        | Partially (`model_dependency`, `attributes` like Scope)      |
| **Maturity & Validity**          | Is the technique well-established, peer-reviewed, and demonstrably effective?                              | Partially (Implied by `resources` like papers)               |
| **Practicality**                 | What are the implementation complexity, computational cost, data needs, and required expertise?            | Partially (`complexity_rating`, `computational_cost_rating`) |
| **Interpretability**             | How easily can the results be understood by stakeholders and used in an argument?                          | No (Requires qualitative assessment)                         |
| **Limitations & Assumptions**    | Are the technique's weaknesses, constraints, and necessary assumptions clearly documented?                 | Yes (via `limitations` relationship)                         |
| **Tooling & Resources**          | Are implementations, libraries, or detailed guides available?                                              | Yes (via `resources` relationship)                           |