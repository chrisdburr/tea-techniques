# Technique Dataset Evaluation Report (techniques.json)

This report tracks the evaluation of techniques listed in `backend/data/techniques.json` based on the criteria defined in `docs/TECHNIQUE-EVALUATION-CRITERIA.md`.

## Techniques Reviewed

- Techniques corresponding to IDs 1 through 124 (Lines 2-3699 approx. - based on file reads). **Review complete.**

## Recommendations Summary

### Keep & Enhance

The following techniques represent distinct and valuable concepts for AI assurance and should be retained. They require enhancement with more details based on the evaluation criteria (e.g., Data Type Applicability, Lifecycle Stage, Interpretability Notes).

- **ID 1:** SHAP (Lines 2-99)
- **ID 2:** Permutation Importance (Lines 100-177)
- **ID 3:** Mean Decrease Impurity (MDI) (Lines 178-239)
- **ID 5:** Coefficient Magnitudes (Lines 306-339)
- **ID 6:** Integrated Gradients (Lines 340-373)
- **ID 7:** DeepLIFT (Lines 374-406)
- **ID 8:** Layer-wise Relevance Propagation (LRP) (Lines 407-439)
- **ID 10:** Contextual Decomposition (Lines 471-502)
- **ID 11:** Taylor Decomposition (Lines 503-533)
- **ID 12:** Sobol Indices (Lines 534-562)
- **ID 13:** Feature Interaction Detection (H-statistic) (Lines 563-591)
- **ID 14:** LIME (Lines 592-620)
- **ID 15:** Ridge Regression Surrogates (Lines 621-649)
- **ID 16:** Partial Dependence Plots (PDP) (Lines 650-678)
- **ID 17:** Accumulated Local Effects Plots (ALE) (Lines 679-707)
- **ID 18:** Individual Conditional Expectation Plots (ICE) (Lines 708-736)
- **ID 19:** Saliency Maps (Lines 737-768)
- **ID 20:** Grad-CAM (Lines 769-800)
- **ID 21:** Occlusion Sensitivity (Lines 801-833)
- **ID 22:** Attention Mechanisms (Lines 834-866)
- **ID 23:** Factor Analysis (Lines 867-895)
- **ID 24:** PCA (Lines 896-924)
- **ID 25:** t-SNE (Lines 925-953)
- **ID 26:** UMAP (Lines 954-982)
- **ID 27:** Prototype and Criticism Models (Lines 983-1011)
- **ID 28:** Influence Functions (Lines 1012-1040)
- **ID 29:** CEM (Contrastive Explanation Method) (Lines 1041-1069)
- **ID 31:** ANCHOR (Lines 1070-1098)
- **ID 32:** RuleFit (Lines 1099-1127)
- **ID 33:** Monte Carlo Dropout (Lines 1128-1158)
- **ID 34:** ODIN (Lines 1159-1189)
- **ID 35:** Permutation Tests (Lines 1190-1218)
- **ID 37:** Demographic Parity (Lines 1219-1247, 3367-3395) - *Note: Principle/Definition. See Clarification Needed.*
- **ID 39:** Adversarial Debiasing (Lines 1248-1276)
- **ID 40:** Counterfactual Fairness (Lines 1277-1307, 3512-3543) - *Note: Principle/Definition.*
- **ID 42:** Multi-calibration and Multi-accuracy (Lines 1308-1336)
- **ID 44:** Sensitivity Analysis for Fairness (Lines 1337-1365)
- **ID 45:** Synthetic Data Generation (Lines 1366-1394)
- **ID 46:** Federated Learning (Lines 1395-1423)
- **ID 47:** Differential Privacy (Lines 1424-1452) - *Note: Principle/Guarantee.*
- **ID 48:** Homomorphic Encryption (Lines 1453-1476, 1525-1548)
- **ID 49:** Prediction Intervals (Lines 1477-1500, 1549-1572)
- **ID 50:** Quantile Regression (Lines 1501-1524, 1573-1599)
- **ID 51:** Conformal Prediction (Lines 1600-1623)
- **ID 52:** Empirical Calibration (Lines 1624-1647)
- **ID 53:** Temperature Scaling (Lines 1648-1674)
- **ID 54:** Deep Ensembles (Lines 1675-1700)
- **ID 55:** Bootstrapping (Lines 1701-1724)
- **ID 56:** Jackknife Resampling (Lines 1725-1748)
- **ID 57:** Cross-validation (Lines 1749-1772)
- **ID 59:** Area Under Precision-Recall Curve (AUPRC) (Lines 1797-1820)
- **ID 60:** Precision Metrics for High-Risk Domains (Lines 1821-1844)
- **ID 61:** Internal Review Boards (Lines 1845-1868)
- **ID 62:** Red Teaming (Lines 1869-1892)
- **ID 63:** Anomaly Detection (Lines 1893-1916)
- **ID 64:** Human-in-the-Loop Safeguards (Lines 1917-1940)
- **ID 65:** Confidence Thresholding (Lines 1941-1964)
- **ID 66:** Runtime Monitoring and Circuit Breakers (Lines 1965-1988)
- **ID 67:** Model Cards (Lines 1989-2012)
- **ID 68:** Datasheets for Datasets (Lines 2013-2036)
- **ID 69:** System Documentation Templates (Lines 2037-2060)
- **ID 70:** ML System Lineage (Lines 2061-2084)
- **ID 71:** Automated Documentation Generation (Lines 2085-2108)
- **ID 72:** Model Distillation (Lines 2109-2134)
- **ID 73:** Model Extraction (Lines 2135-2158)
- **ID 75:** Monotonicity Constraints (Lines 2183-2206)
- **ID 76:** Decision Trees and Rule Lists (Lines 2207-2238)
- **ID 77:** Linear/Logistic Models with Few Features (Lines 2239-2270)
- **ID 78:** Generalized Additive Models (GAMs) (Lines 2271-2301)
- **ID 79:** Naive Bayes and Probabilistic Models (Lines 2302-2333)
- **ID 83:** Model Pruning (Lines 2426-2456)
- **ID 85:** Attention Visualisation in Transformers (Lines 2486-2517)
- **ID 86:** Neuron Activation Analysis (Lines 2518-2553)
- **ID 87:** Prompt Sensitivity Analysis (Lines 2554-2584)
- **ID 88:** Causal Mediation Analysis in Language Models (Lines 2585-2619)
- **ID 89:** Feature Attribution with Integrated Gradients in NLP (Lines 2620-2651)
- **ID 90:** Concept Activation Vectors (CAVs) (Lines 2652-2684)
- **ID 91:** In-Context Learning Analysis (Lines 2685-2715)
- **ID 92:** Reweighing (Lines 2716-2744)
- **ID 93:** Disparate Impact Remover (Lines 2745-2773)
- **ID 95:** Fairness GAN (Lines 2803-2833)
- **ID 96:** Optimised Pre-Processing (Lines 2834-2862)
- **ID 97:** Relabelling (Lines 2863-2891)
- **ID 98:** Preferential Sampling (Lines 2892-2920)
- **ID 99:** Fairness Through Unawareness (Lines 2921-2949)
- **ID 100:** Adversarial Debiasing for Text (Lines 2950-2981)
- **ID 101:** Fair Adversarial Networks (Lines 2982-3012)
- **ID 102:** Prejudice Remover Regulariser (Lines 3013-3044)
- **ID 103:** Meta Fair Classifier (Lines 3045-3073)
- **ID 104:** Exponentiated Gradient Reduction (Lines 3074-3102)
- **ID 105:** Fair Transfer Learning (Lines 3103-3134)
- **ID 106:** Adaptive Sensitive Reweighting (Lines 3135-3163)
- **ID 107:** Multi-Accuracy Boosting (Lines 3164-3192)
- **ID 108:** Equalised Odds Post-Processing (Lines 3193-3221)
- **ID 109:** Threshold Optimiser (Lines 3222-3250)
- **ID 110:** Reject Option Classification (Lines 3251-3279)
- **ID 111:** Calibration with Equality of Opportunity (Lines 3280-3308)
- **ID 112:** Statistical Parity Difference (Lines 3309-3337) - *See Clarification Needed*
- **ID 113:** Disparate Impact (Lines 3338-3366) - *See Clarification Needed*
- **ID 115:** Equal Opportunity Difference (Lines 3396-3424)
- **ID 116:** Average Odds Difference (Lines 3425-3453)
- **ID 117:** Individual Fairness Metric (Consistency) (Lines 3454-3482)
- **ID 118:** Algorithmic Fairness using K-NN (Lines 3483-3511)
- **ID 120:** Path-Specific Counterfactual Fairness (Lines 3544-3574)
- **ID 121:** Causal Fairness Assessment with Do-Calculus (Lines 3575-3605)
- **ID 122:** Diversity Constraints in Recommendations (Lines 3606-3638)
- **ID 123:** Bayesian Fairness Regularization (Lines 3639-3669)

### Review for Removal / Merge / Refinement

These techniques represent categories, broad methodologies, duplicates, or applications of other techniques and should be reviewed:

- **ID 4: Gini Importance (Lines 240-305):** Highly redundant with MDI (ID 3).
    - **Recommendation:** Merge relevant details into ID 3 description or remove ID 4.
- **ID 9: Variable Importance in Random Forests (MDA MDG) (Lines 440-470):** Redundant application of Permutation Importance (ID 2) and MDI/Gini (ID 3/4).
    - **Recommendation:** Remove ID 9. Note applicability of ID 2 and ID 3 to Random Forests in their descriptions.
- **ID 38: Fairness-Aware Data Preprocessing (Lines 1219-1247):** Represents a category, not a specific technique.
    - **Recommendation:** Remove ID 38. Ensure specific preprocessing techniques (e.g., ID 92, 93, 96, 97, 98) are adequately covered.
- **ID 41: Fairness Constraints and Regularization (Lines 1277-1307):** Represents a category.
    - **Recommendation:** Remove ID 41. Ensure specific in-processing techniques (e.g., ID 102, 104, 123) are adequately covered.
- **ID 43: Individual Fairness Metrics (Lines 1308-1336):** Represents a category.
    - **Recommendation:** Remove ID 43. Ensure specific individual fairness techniques (e.g., ID 117, 118) are adequately covered.
- **ID 58: Statistical Hypothesis Testing (Lines 1773-1796):** Represents a broad statistical methodology, not a specific AI assurance technique.
    - **Recommendation:** Remove ID 58. Mention its application within relevant techniques where applicable (e.g., comparing model performance).
- **ID 74: Feature Importance Ranking (Lines 2159-2182):** Describes an application/outcome of other techniques (SHAP, Permutation Importance, etc.) rather than a distinct method itself.
    - **Recommendation:** Remove ID 74. Ensure the concept of ranking importance is mentioned within the descriptions of relevant attribution techniques (like ID 1, 2, 3).
- **ID 80: Variable Importance in Random Forests (MDA, MDG) (Lines 2334-2364):** Duplicate of ID 9.
    - **Recommendation:** Remove ID 80.
- **ID 81: Bayesian Networks (Lines 2365-2396):** Describes a *type* of model, not an assurance technique applied *to* a model.
    - **Recommendation:** Remove ID 81. Consider adding a section on inherently interpretable model types if desired.
- **ID 82: Fairness Metrics (e.g., Equalized Odds, Demographic Parity) (Lines 2397-2425):** Represents a category of metrics.
    - **Recommendation:** Remove ID 82. Ensure specific metrics (like ID 37, 108, 112, 113, 115, 116) are covered individually.
- **ID 84: Knowledge Distillation (Lines 2457-2485):** Duplicate of ID 72 (Model Distillation).
    - **Recommendation:** Remove ID 84.
- **ID 94: Learning Fair Representations (Lines 2774-2802):** Potentially too general, similar to ID 38/41.
    - **Recommendation:** Review if this represents a distinct *technique* beyond the general concept, or if specific implementing techniques (like ID 95) suffice. Keep for now but flag for further review.
- **ID 114: Demographic Parity (Lines 3367-3395):** Duplicate of ID 37.
    - **Recommendation:** Remove ID 114.
- **ID 119: Counterfactual Fairness (Causal Modeling) (Lines 3512-3543):** Duplicate of ID 40.
    - **Recommendation:** Remove ID 119.
- **ID 124: SHAP Values for Fairness (Lines 3670-3698):** Application of SHAP (ID 1).
    - **Recommendation:** Merge concept into ID 1 description, remove ID 124.

### Clarify Relationships

- **Group Fairness Metrics:** Review the definitions and distinctions between **Demographic Parity (ID 37)**, **Statistical Parity Difference (ID 112)**, and **Disparate Impact (ID 113)**.
    - **Recommendation:** Ensure these represent distinct, well-defined concepts. Consolidate or refine descriptions if there is significant overlap. Consider framing ID 37 as the principle and ID 112/113 as specific measurement techniques.

## General Recommendations

1.  **Data Cleanup:** The `limitations` field frequently contains escaped JSON strings (e.g., `"[{\"description\": \"...\"}]"`). This format needs to be corrected across the entire dataset to use a standard JSON array of strings or objects (e.g., `[{"description": "..."}]` or `["Limitation text"]`).
2.  **Enhancement:** All retained techniques should be systematically reviewed against the criteria in `docs/TECHNIQUE-EVALUATION-CRITERIA.md` and enriched with missing details (e.g., Data Type Applicability, Lifecycle Stage, Interpretability Notes).