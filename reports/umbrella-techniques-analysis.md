# Umbrella Techniques Analysis Report

**Date:** 2026-02-18
**Issue:** tea-techniques-kxb
**Scope:** All 121 techniques reviewed by 3 parallel analysis agents

## Summary

| Classification | Count | Description |
|---------------|-------|-------------|
| UMBRELLA-A | 7 | Specific alternatives already exist in dataset — redundancy now |
| UMBRELLA-B | 3 | Broad concept, specific alternatives should be added over time |
| BORDERLINE | 8 | Could go either way, mostly recommend keeping with refinements |
| SPECIFIC | 103 | Concrete named methods — no action needed |

---

## UMBRELLA-A: Retire, Convert to Tag, or Narrow Scope

These entries represent families/concepts where specific implementations **already exist** as separate techniques, creating redundancy in search and `suggestForClaim` results.

### 1. `prediction-intervals` — Prediction Intervals

**Problem:** Describes a statistical *output type* (range of plausible values), not a method. All four implementations already exist as separate entries.

**Children in dataset:**
- `conformal-prediction`
- `quantile-regression`
- `bootstrapping`
- `jackknife-resampling`

**Recommendation:** **Retire / convert to tag.** The tag `evidence-type/prediction-interval` already exists in the taxonomy. The entry adds no method not covered by its children.

---

### 2. `intrinsically-interpretable-models` — Intrinsically Interpretable Models

**Problem:** Description literally says "This category includes decision trees and rule lists...linear and logistic regression models...and GAMs." This is a category header, not a technique.

**Children in dataset:**
- `generalized-additive-models`
- `coefficient-magnitudes-in-linear-models`
- `rulefit`
- `anchor` (rule-based)
- `monotonicity-constraints`

**Recommendation:** **Convert to tag** (`model-type/intrinsically-interpretable` or similar). The concept is important for navigation but should not compete as a peer technique alongside its own members.

---

### 3. `anomaly-detection` — Anomaly Detection

**Problem:** Describes "statistical, machine learning, or rule-based methods" — a family, not a method. Mentions isolation forests, autoencoders, statistical process control as examples.

**Children in dataset:**
- `out-of-distribution-detector-for-neural-networks` (ODIN)
- `out-of-domain-detection`
- `data-poisoning-detection`
- `runtime-monitoring-and-circuit-breakers`

**Recommendation:** **Convert to tag** (`approach/anomaly-detection`) applied to children. If the entry is kept, narrow to a specific algorithm (e.g., Isolation Forest).

---

### 4. `safety-guardrails` — Safety Guardrails

**Problem:** Describes a deployment *architectural pattern* (input filtering, output classifiers, rule-based systems, monitoring), not a single technique. All components are separately covered.

**Children in dataset:**
- `runtime-monitoring-and-circuit-breakers`
- `jailbreak-resistance-testing`
- `toxicity-and-bias-detection`
- `out-of-domain-detection`
- `confidence-thresholding`

**Recommendation:** **Retire or convert to tag.** Better served as a category grouping the above techniques.

---

### 5. `ai-agent-safety-testing` — AI Agent Safety Testing

**Problem:** Describes a *test programme* scope (tool-use correctness, constraint compliance, error handling) rather than a methodology. All specific facets already exist.

**Children in dataset:**
- `agent-goal-misalignment-testing`
- `multi-agent-system-testing`
- `prompt-injection-testing`
- `jailbreak-resistance-testing`
- `reward-hacking-detection`

**Recommendation:** **Retire or convert to parent category.** The dataset has sufficient specific coverage of agentic testing.

---

### 6. `adversarial-robustness-testing` — Adversarial Robustness Testing

**Problem:** Names FGSM, PGD, C&W, AutoAttack as constituent methods. Multiple specific adversarial testing entries already exist.

**Children in dataset:**
- `jailbreak-resistance-testing`
- `prompt-injection-testing`
- `data-poisoning-detection`
- `adversarial-training-evaluation`
- `red-teaming`

**Recommendation:** **Narrow scope** to non-LLM input perturbation attacks (image/tabular, FGSM/PGD class) to make it specific. Or retire.

---

### 7. `hallucination-detection` — Hallucination Detection

**Problem:** Lists "automated consistency checking, self-consistency methods, uncertainty quantification, and human evaluation" — a problem domain, not a single technique.

**Children in dataset:**
- `chain-of-thought-faithfulness-evaluation`
- `retrieval-augmented-generation-evaluation`
- `epistemic-uncertainty-quantification`
- `confidence-thresholding`

**Recommendation:** **Narrow to self-consistency checking approach** (query model multiple times, check agreement) — a distinct method not covered elsewhere. Or convert to tag.

---

## UMBRELLA-B: Keep for Now, Flag for Future

These entries are broad concepts where specific alternatives **don't yet exist** in the dataset but the field has matured enough that they should be added over time.

### 8. `synthetic-data-generation` — Synthetic Data Generation

**Problem:** Names GANs, VAEs, statistical sampling, differential privacy as implementation approaches. Partially covered by `fairness-gan` and `differential-privacy`.

**Missing children (suggested):** CTGAN, VAE-based synthetic data, statistical simulation methods

**Recommendation:** **Keep with restructuring.** Add missing children before considering retirement. Currently serves as a necessary connecting entry.

---

### 9. `automated-documentation-generation` — Automated Documentation Generation

**Problem:** Covers "programmatic scripts, LLMs, and extraction tools" — a family united only by goal. Overlaps with `model-cards`, `datasheets-for-datasets`, `mlflow-experiment-tracking`, `data-version-control`.

**Recommendation:** **Retire or merge.** The specific documentation tools already cover this space. If kept, narrow to LLM-assisted documentation specifically.

---

### 10. `internal-review-boards` — Internal Review Boards

**Problem:** Governance *framework/process category* rather than a single method. No specific children exist yet.

**Missing children (suggested):** AI Ethics Committees, Algorithmic Impact Assessment, Third-Party Audit

**Recommendation:** **Keep as-is.** No children to split into. Annotate as governance process. Revisit when related entries are added.

---

## BORDERLINE: Keep with Refinements

### 11. `saliency-maps` — Saliency Maps

**Issue:** Entry describes vanilla gradient saliency specifically, but the name is used broadly for any visual attribution heatmap.
**Recommendation:** Rename to "Vanilla Gradient Saliency" or "Gradient Saliency" to disambiguate.

### 12. `red-teaming` — Red Teaming

**Issue:** Broad scope overlapping with specific testing entries, but legitimately distinct as a *process/methodology* (team composition, adversarial campaign).
**Recommendation:** Keep. Tighten description to position as orchestrating process, cross-reference specific tests.

### 13. `human-in-the-loop-safeguards` — Human-in-the-Loop Safeguards

**Issue:** Architectural design principle, but no specific HITL mechanisms exist as separate entries.
**Recommendation:** Keep as-is. No harmful redundancy.

### 14. `toxicity-and-bias-detection` — Toxicity and Bias Detection

**Issue:** Conflates two distinct concerns. Bias is well-covered elsewhere; toxicity is the only representative.
**Recommendation:** **Split.** Rename to `toxicity-detection` (keep). Link bias dimension to existing fairness entries.

### 15. `multi-agent-system-testing` — Multi-Agent System Testing

**Issue:** Broad but addresses distinct emergent inter-agent behavior not covered elsewhere.
**Recommendation:** Keep. Clarify scope to emergent system-level behavior.

### 16. `out-of-domain-detection` — Out-of-Domain Detection

**Issue:** Similar to but distinct from `out-of-distribution-detector-for-neural-networks` (ODIN).
**Recommendation:** Keep. Add scope note clarifying distinction (deployment-side domain routing vs. gradient-based OOD).

### 17. `factor-analysis` — Factor Analysis

**Issue:** Could seem like umbrella for latent factor models, but is a specific statistical method.
**Recommendation:** Keep as-is. Not actually umbrella.

### 18. `prototype-and-criticism-models` — Prototype and Criticism Models

**Issue:** Written as a grouping but no children exist in dataset.
**Recommendation:** Keep as-is. Revisit if specific entries (ProtoDash, MMD-critic) are added later.

---

## Priority Actions

### Tier 1: Clear Umbrellas — Act Now
1. `prediction-intervals` → retire/convert to tag
2. `intrinsically-interpretable-models` → convert to tag
3. `safety-guardrails` → retire/convert to tag
4. `ai-agent-safety-testing` → retire/convert to tag

### Tier 2: Umbrellas Needing Scope Narrowing
5. `anomaly-detection` → convert to tag OR narrow to specific algorithm
6. `adversarial-robustness-testing` → narrow to non-LLM perturbation attacks
7. `hallucination-detection` → narrow to self-consistency checking

### Tier 3: Description Refinements
8. `saliency-maps` → rename for disambiguation
9. `red-teaming` → tighten description scope
10. `toxicity-and-bias-detection` → split into toxicity-only entry
11. `automated-documentation-generation` → retire or narrow to LLM-assisted

### Tier 4: Monitor for Future
12. `synthetic-data-generation` → add children before considering retirement
13. `internal-review-boards` → keep, flag as governance process
14. `multi-agent-system-testing` → keep, clarify emergent behavior scope
