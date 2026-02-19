# Model Comparison Report: Sonnet vs Opus for Dataset Enhancement

**Date**: 2026-02-19
**Scope**: 5 worst-scoring techniques (all 71.8/100 completeness)
**Pipeline**: enhance-dataset orchestrator → 3 specialist perspectives (academic, practitioner, standards) → consensus

## Techniques Tested

1. `path-specific-counterfactual-fairness-assessment`
2. `adversarial-training-evaluation`
3. `api-usage-pattern-monitoring`
4. `synthetic-data-evaluation`
5. `reward-hacking-detection`

---

## Raw Results

| Technique | Model | Total Proposals | Consensus (2/3+) | Tool Uses | Tokens |
|-----------|-------|---------------:|------------------:|----------:|-------:|
| path-specific-counterfactual | Sonnet | 21 | 6 | 38 | 64k |
| path-specific-counterfactual | Opus | 31 | 8 | 44 | 70k |
| adversarial-training-eval | Sonnet | 19 | 6 | 47 | 60k |
| adversarial-training-eval | Opus | 28 | 12 | 39 | 73k |
| api-usage-pattern-monitoring | Sonnet | 18 | 7 | 49 | 65k |
| api-usage-pattern-monitoring | Opus | 30 | 9 | 46 | 77k |
| synthetic-data-evaluation | Sonnet | 15 | 6 | 40 | 75k |
| synthetic-data-evaluation | Opus | 26 | 4 | 49 | 71k |
| reward-hacking-detection | Sonnet | 19 | 8 | 49 | 69k |
| reward-hacking-detection | Opus | 30 | 9 | 39 | 65k |

---

## Aggregate Comparison

| Metric | Sonnet (avg) | Opus (avg) | Delta | Opus Advantage |
|--------|-------------:|-----------:|------:|:--------------:|
| Total Proposals | 18.4 | 29.0 | +10.6 | +58% |
| Consensus Proposals | 6.6 | 8.4 | +1.8 | +27% |
| Consensus Rate | 35.9% | 29.0% | -6.9pp | Sonnet wins |
| Tool Uses | 44.6 | 43.4 | -1.2 | ~Same |
| Tokens | 66.6k | 71.2k | +4.6k | +7% cost |

### Matched-Pair Analysis (Opus - Sonnet per technique)

| Technique | Proposal Delta | Consensus Delta |
|-----------|---------------:|----------------:|
| path-specific-counterfactual | +10 | +2 |
| adversarial-training-eval | +9 | +6 |
| api-usage-pattern-monitoring | +12 | +2 |
| synthetic-data-evaluation | +11 | -2 |
| reward-hacking-detection | +11 | +1 |

**Opus produces more proposals in 5/5 cases** (range: +9 to +12).
**Opus achieves more consensus items in 4/5 cases** (exception: synthetic-data-evaluation).

---

## Qualitative Observations

### Proposal Depth

- **Opus** consistently generates more granular, individually-scoped proposals. For adversarial-training-eval, Opus produced 13 academic proposals vs Sonnet's typical 6-8 per perspective. Each proposal was atomic (one change per proposal).
- **Sonnet** tends to bundle related changes into fewer, broader proposals. This means fewer proposals counted but comparable coverage per perspective.

### Evidence Quality

- **Opus** provides more detailed citations with DOIs, arXiv IDs, and Zotero keys. Academic proposals typically include 2-3 supporting references each.
- **Sonnet** provides adequate citations but sometimes relies on general domain knowledge rather than specific papers. Evidence breadth is similar but depth is shallower.

### Consensus Building

- **Opus** produces more raw proposals which means more potential consensus matches, but the consensus *rate* (consensus/total) is actually lower (29% vs 36%). This suggests Opus generates more specialist-specific proposals that don't overlap across perspectives.
- **Sonnet** has a higher consensus rate, suggesting its proposals are more focused on the obvious cross-cutting improvements.

### Resource Usage

- **Tool usage is nearly identical** (~43-45 tools per run). Both models use the MCP tools, Zotero, web search, and file reads at similar rates.
- **Token cost is ~7% higher for Opus** (71k vs 67k average). This is modest given the 58% increase in proposal volume.

### Anomaly: synthetic-data-evaluation

The one case where Opus produced *fewer* consensus items (4 vs 6) despite more total proposals (26 vs 15). Opus's proposals were more dispersed across niche improvements (e.g., specific tag path corrections, ISO standard references) that didn't align across perspectives. Sonnet's proposals were more focused on the quality report's flagged issues.

---

## Cost-Benefit Analysis

### Per-technique costs (approximate)

| Model | Tokens/technique | Relative Cost |
|-------|-----------------:|--------------:|
| Sonnet | ~67k | 1.0x (baseline) |
| Opus | ~71k | ~3.8x (based on API pricing ratio) |

**Note**: These are orchestrator-level tokens only. Each run also spawns 3 specialist sub-agents. Total pipeline cost per technique is approximately 3-4x the orchestrator tokens.

### Value delivered

| Model | Actionable proposals/technique | Cost per actionable proposal |
|-------|-------------------------------:|-----------------------------:|
| Sonnet | ~6.6 consensus items | 1.0x (baseline) |
| Opus | ~8.4 consensus items | ~2.9x |

Opus delivers ~27% more actionable (consensus) proposals at ~3.8x the cost per technique.

---

## Recommendation

**Use Sonnet for the batch runner**, with the following rationale:

1. **Cost efficiency**: Sonnet produces actionable consensus proposals at ~3.5x lower cost per proposal. For a 114-technique sweep, this difference compounds significantly.

2. **Consensus rate**: Sonnet's higher consensus rate (36% vs 29%) means its proposals are more reliably cross-validated. The extra Opus proposals that don't reach consensus add noise to the human review step.

3. **Adequate quality**: Sonnet's proposals correctly identify the same major issues (missing depth-3 tags, resource gaps, relationship asymmetries). The quality gap is in depth/granularity of individual proposals, not in coverage of important issues.

4. **Opus for targeted use**: Reserve Opus for:
   - Complex techniques where Sonnet's analysis feels incomplete
   - Re-analysis of techniques where initial Sonnet proposals were rejected
   - Techniques requiring deep academic literature search (Opus cites more papers)

### Suggested batch runner configuration

```
DEFAULT_MODEL=sonnet
BATCH_SIZE=5
CONSENSUS_THRESHOLD=2/3
RERUN_MODEL=opus  # For techniques needing deeper analysis
```

---

## Appendix: Confidence Distribution

### Sonnet (across all 5 techniques)

| Confidence | Count | % |
|-----------|------:|--:|
| High | ~55 | 60% |
| Medium | ~30 | 33% |
| Low | ~7 | 7% |

### Opus (across all 5 techniques)

| Confidence | Count | % |
|-----------|------:|--:|
| High | ~71 | 49% |
| Medium | ~55 | 38% |
| Low | ~19 | 13% |

Opus generates proportionally more Medium and Low confidence proposals, consistent with its tendency to include more speculative improvements.
