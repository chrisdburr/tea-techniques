# Guide to Developing a New Technique

This guide provides best practices for adding new techniques to the TEA Techniques database. All techniques are stored in `/public/data/techniques.json` and must follow the structure and standards outlined below.

## JSON Schema Reference

Each technique in `techniques.json` follows this structure:

```typescript
{
  slug: string;                       // Required: URL-friendly identifier
  name: string;                       // Required: Human-readable name
  description: string;                // Required: Clear explanation
  assurance_goals: string[];          // Required: Associated goals
  tags: string[];                     // Required: Categorisation tags
  example_use_cases: UseCase[];       // Required: Real-world examples
  limitations: Limitation[];          // Required: Known constraints
  resources: Resource[];              // Required: Supporting materials
  acronym?: string;                   // Optional: Common abbreviation
  complexity_rating?: number;         // Optional: 1-5 difficulty scale
  computational_cost_rating?: number; // Optional: 1-5 resource scale
  related_techniques?: string[];      // Optional: Slugs of related techniques
}
```

### Supporting Types

```typescript
interface UseCase {
  description: string;  // Practical application example
  goal: string;        // Associated assurance goal
}

interface Limitation {
  description: string;  // Constraint or caveat
}

interface Resource {
  title: string;               // Resource name
  url: string;                 // Link to resource
  source_type: string;         // Type: software_package | tutorial | technical_paper | documentation | blog_post
  authors?: string[];          // For technical papers
  publication_date?: string;   // For technical papers (YYYY-MM-DD)
}
```

## Field-by-Field Best Practices

### 1. `slug` (Required)

The URL-friendly identifier for the technique.

**Guidelines:**
- **Use lowercase with hyphens**: Transform the technique name to lowercase and replace spaces with hyphens (e.g., "Model Cards" → `model-cards`)
- **Keep it concise**: Use abbreviations if the technique has a widely recognised acronym (e.g., "SHapley Additive exPlanations" → `shapley-additive-explanations` with `acronym: "SHAP"`)
- **Ensure uniqueness**: Check existing techniques to avoid duplicates

### 2. `name` (Required)

The human-readable technique name as it appears throughout the interface.

**Guidelines:**
- **Use proper capitalisation**: Follow standard title case or the technique's established convention (e.g., "Model Cards", "SHapley Additive exPlanations")
- **Avoid unnecessary abbreviations**: Write out the full name unless the acronym is the official name (prefer "Local Interpretable Model-agnostic Explanations" over "LIME" in the name field)
- **Be consistent with academic literature**: Use the name as it appears in primary sources or official documentation

### 3. `description` (Required)

A comprehensive explanation of what the technique does and how it works.

**Guidelines:**
- **Write for a broad audience**: Avoid jargon and technical terms without explanation; assume readers have general AI knowledge but may not be domain experts
- **Use British English**: Employ British spelling and grammar conventions (e.g., "categorise" not "categorize", "behaviour" not "behavior")
- **Structure clearly**: Begin with a concise overview (1-2 sentences), then elaborate on the mechanism and outputs; aim for 3-5 sentences total

**Example:**
> Permutation Importance quantifies a feature's contribution to a model's performance by randomly shuffling its values and measuring the resulting drop in predictive accuracy. If shuffling a feature significantly degrades the model's performance, that feature is considered important. This model-agnostic technique helps identify which inputs are genuinely driving predictions, rather than just being correlated with the outcome.

### 4. `assurance_goals` (Required)

An array of assurance goals that the technique addresses.

**Valid Values:** `["Explainability", "Fairness", "Privacy", "Reliability", "Safety", "Security", "Transparency"]`

**Guidelines:**
- **Include all relevant goals**: A technique can address multiple goals; include all that apply (e.g., SHAP addresses Explainability, Fairness, and Reliability)
- **Match with use cases**: Ensure each assurance goal listed has at least one corresponding use case in `example_use_cases`
- **Justify selections**: Consider whether the technique provides direct evidence for the goal or merely supports adjacent concerns

### 5. `tags` (Required)

Hierarchical categorisation tags following the structured taxonomy.

**Format:** `category/value` or `category/value/sub-value/...` (lowercase, hyphen-separated)

**Tag Categories:**
1. `assurance-goal-category/*` — Goals and sub-categories (e.g., `explainability/attribution-methods/perturbation-based`)
2. `applicable-models/*` — Model types (e.g., `architecture/neural-network`)
3. `lifecycle-stage/*` — Project phases (e.g., `model-development`, `deployment`)
4. `expertise-needed/*` — Required expertise (e.g., `statistics`, `domain-knowledge`)
5. `evidence-type/*` — Output types (e.g., `quantitative-metric`, `documentation`)
6. `data-type/*` — Applicable data (e.g., `tabular`, `text`, `image`)
7. `data-requirements/*` — Data dependencies (e.g., `model-internals`, `no-special-requirements`)
8. `technique-type/*` — Fundamental approach (e.g., `algorithmic`, `stakeholder-engagement`)
9. `explanatory-scope/*` — Explanation level (e.g., `local`, `global`)
10. `fairness-approach/*` — Fairness perspective (e.g., `individual-fairness`, `group-fairness`)

**Guidelines:**
- **Follow the established taxonomy**: Refer to [/docs/tag-reference](/docs/tag-reference) for all available tags; propose new tags only when existing ones do not fit
- **Use appropriate granularity**: Include both broad category tags and specific hierarchical tags (e.g., both `assurance-goal-category/explainability` and `assurance-goal-category/explainability/attribution-methods/perturbation-based`)
- **Tag comprehensively**: Apply all relevant tags across all categories to maximise discoverability and accurate filtering

### 6. `example_use_cases` (Required)

Real-world applications demonstrating the technique's value.

**Guidelines:**
- **Provide diverse examples**: Cover different domains/sectors (healthcare, finance, public sector, etc.) to demonstrate broad applicability
- **Match each assurance goal**: Include at least one use case for each goal listed in `assurance_goals`
- **Be specific and concrete**: Describe tangible scenarios with context (e.g., "Analysing a customer churn prediction model to understand why a specific high-value customer was flagged as likely to leave...")

**Example:**
```json
{
  "description": "Auditing a loan approval model by comparing SHAP values for applicants from different demographic groups, ensuring that protected characteristics like race or gender do not have an undue influence on credit decisions.",
  "goal": "Fairness"
}
```

### 7. `limitations` (Required)

Known constraints, assumptions, or scenarios where the technique may not be suitable.

**Guidelines:**
- **Be honest and balanced**: Acknowledge genuine limitations without undermining the technique's value; this builds trust and sets appropriate expectations
- **Cover different limitation types**: Include theoretical constraints, computational costs, data requirements, and scenarios where the technique fails or produces misleading results
- **Explain the impact**: Don't just state the limitation; clarify why it matters or what it means for practitioners

**Example:**
```json
{
  "description": "Assumes feature independence, which can produce misleading explanations when features are highly correlated, as the model may attribute importance to features that are merely proxies for others."
}
```

### 8. `resources` (Required)

Supporting materials including software packages, tutorials, papers, and documentation.

**Source Types:**
- `software_package` — Official implementations, libraries, or tools
- `tutorial` — Step-by-step guides, blog posts, or educational content
- `technical_paper` — Academic papers, research articles, or whitepapers
- `documentation` — Official docs, standards, or specifications
- `blog_post` — Informal articles or community posts

**Guidelines:**
- **Prioritise quality over quantity**: Include 3-7 high-quality resources; start with official implementations, foundational papers, and accessible tutorials
- **Provide complete citations for papers**: Include `authors` array and `publication_date` (YYYY-MM-DD format) for all technical papers
- **Link to stable URLs**: Use DOI links for papers, official repositories for software, and permanent documentation URLs when available

**Example:**
```json
{
  "title": "An empirical study of the effect of background data size on SHAP",
  "url": "http://arxiv.org/pdf/2204.11351v3",
  "source_type": "technical_paper",
  "authors": ["Han Yuan", "Mingxuan Liu", "Lican Kang"],
  "publication_date": "2022-04-24"
}
```

### 9. `acronym` (Optional)

Common abbreviation or acronym for the technique.

**Guidelines:**
- **Use only for well-established acronyms**: Include this field only if the technique is commonly referred to by its acronym (e.g., "SHAP", "LIME", "GDPR")
- **Use uppercase**: Acronyms should be in all capitals unless the official convention differs
- **Avoid creating new acronyms**: Do not invent acronyms for techniques that don't have established ones

### 10. `complexity_rating` (Optional)

Difficulty level for understanding and implementing the technique (1-5 scale).

**Scale:**
- `1` — Basic understanding; minimal prerequisites
- `2` — Intermediate; requires some domain knowledge
- `3` — Moderate; requires solid technical background
- `4` — Advanced; requires specialised expertise
- `5` — Expert; requires deep theoretical and practical knowledge

**Guidelines:**
- **Consider both conceptual and implementation complexity**: Rate based on what's needed to understand the theory AND apply it effectively
- **Be consistent with similar techniques**: Compare with existing techniques in the database to maintain relative consistency
- **Target the typical practitioner**: Assume the reader has general AI/ML knowledge but may lack specialised expertise

### 11. `computational_cost_rating` (Optional)

Resource intensity for running the technique (1-5 scale).

**Scale:**
- `1` — Negligible; runs instantly on small datasets
- `2` — Low; suitable for standard laptops/workstations
- `3` — Moderate; may require dedicated compute for large datasets
- `4` — High; typically requires HPC or cloud resources
- `5` — Very high; requires significant infrastructure or specialised hardware

**Guidelines:**
- **Consider scalability**: Rate based on typical use cases, not minimal examples or extreme edge cases
- **Account for model size**: Techniques that are cheap for small models but expensive for large ones should be rated higher
- **Distinguish from implementation efficiency**: Rate the technique's inherent cost, not poor implementations

### 12. `related_techniques` (Optional)

Array of slugs for techniques with similar purposes, approaches, or complementary use cases.

**Guidelines:**
- **Include 3-6 related techniques**: Provide enough alternatives without overwhelming users
- **Prioritise close relationships**: Include techniques that are direct alternatives, use similar methods, or serve complementary purposes
- **Ensure reciprocity**: When adding a new technique, consider updating related techniques to reference it back

## Pre-Submission Checklist

Before submitting a new technique, verify:

- [ ] All required fields are complete
- [ ] Description is clear, jargon-free, and written in British English
- [ ] All assurance goals have corresponding use cases
- [ ] Tags follow the established taxonomy (see `/docs/tag-reference`)
- [ ] Use cases cover diverse domains and are specific/concrete
- [ ] Limitations are honest, balanced, and explain impact
- [ ] Resources include stable URLs and complete citations for papers
- [ ] Technique has been evaluated against [evaluation criteria](/about/technique-evaluation)
- [ ] JSON is valid and properly formatted
- [ ] `slug` is unique and doesn't conflict with existing techniques

## Validation & Testing

After adding your technique to `techniques.json`:

```bash
# Regenerate derived data files
pnpm generate-data

# Validate TypeScript types
pnpm type-check

# Check code quality
pnpm lint

# Build the site
NODE_ENV=production pnpm build
```

## Additional Resources

- **Tag Reference:** [/docs/tag-reference](/docs/tag-reference) — Complete list of all available tags
- **Data Schema:** [/docs/data-schema](/docs/data-schema) — Technical schema documentation
- **Evaluation Criteria:** [/about/technique-evaluation](/about/technique-evaluation) — Standards for technique inclusion
- **Contribution Guide:** [/about/community-contributions](/about/community-contributions) — How to submit your technique

## Questions or Help?

If you need assistance:

1. Review existing techniques in `techniques.json` for examples
2. Consult the [evaluation criteria](/about/technique-evaluation) for inclusion standards
3. Open a [GitHub issue](https://github.com/alan-turing-institute/tea-techniques/issues) with questions
4. Submit a draft PR for early feedback from maintainers
