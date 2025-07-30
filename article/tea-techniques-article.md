---
title:
  'TEA Techniques: An Interactive Database for Trustworthy and Ethical AI
  Assurance'
author:
  - name: 'Christopher Burr'
    affiliation: 'The Alan Turing Institute'
    email: 'cburr@turing.ac.uk'
    orcid: '0000-0003-0386-8182'
date: '2025'
abstract: |
  In this paper we present Trustworthy and EThical Assurance (TEA) Techniques, an interactive and community-centred dataset containing
  92 curated techniques for assuring artificial intelligence (AI) systems. The dataset organises techniques around the assurance goals they support, including explainability, fairness, safety, security, and more. It also provides structured metadata through an extensible tag system (e.g. #applicable-models, #expertise-needed). To ensure each technique actionable, high-quality resources are made available (e.g. official software packages, journal articles, tutorials). We explain how these resources were discovered through a systematic search process, and how the interactive application will enable the techniques and resources to be updated and refined as new advances and methods emerge. The platform is made freely available and open source as a static web application to provide AI professionals, practitioners, and researchers with immediate access to actionable techniques for building robust AI assurance
  cases. We provide a case study of an agentic digital twin in healthcare to motivate use of the TEA techniques. The TEA Techniques database represents a significant step
  towards building a more inclusive and flourishing AI assurance ecosystem, fostering community-driven
  development of responsible AI practices.
keywords:
  - AI assurance
  - trustworthy AI
  - responsible AI
  - ethical AI
  - explainable AI
  - AI fairness
bibliography-title: 'References'
reference-section-title: 'References'
lang: en-GB
---

# Introduction

The deployment of artificial intelligence (AI) systems across key sectors of
critical national infrastructure (CNI) demands an urgent and systematic approach
to evidencing their trustworthiness and ethical alignment. While considerable
progress has been made in developing principles and frameworks for responsible
AI [@brundage2020toward; @raji2020closing], practitioners continue to struggle
with identifying and implementing concrete techniques that can generate
meaningful evidence for AI assurance claims. For instance, many now know that AI
can create and exacerbate biases and discriminatory impacts, but may struggle to
know which technique they should use to mitigate these biases and how to
appropriately communicate the processes to affected stakeholder or impacted
users.

This gap between high-level normative principles and actionable methods is well
recognised, and represents a significant barrier to the widespread adoption of
responsible AI practices. Fortunately, a considerable amount of research effort
has gone into developing techniques for different AI assurance techniques. But
now the challenge is how to navigate the slightly fragmented landscape.

Techniques for explainable AI, bias assessment and mitigation, privacy
preservation, and other assurance goals are scattered across academic
literature, software repositories, technical blogs, and proprietary
documentation. Practitioners seeking to build comprehensive assurance cases must
navigate this dispersed knowledge base, often lacking the time or expertise to
evaluate the relevance and quality of available resources or to appropriately
determine whether the technique they have identified is the best one for their
specific use case. Moreover, the rapid evolution of AI technologies means that
new techniques emerge constantly, and existing methods may become outdated or
superseded.

To address these challenges, we present _TEA Techniques_: an interactive
database designed to improve access to practical methods for evidencing claims
about responsible AI design, development, and deployment. Currently, the
database contains approximately 100 techniques[^approximate] organised around
seven core assurance goals: explainability, fairness, privacy, reliability,
safety, security, and transparency.

[^approximate]:
    At the time of submisison, the exact number is 92. However, we report an
    approximate number as this figure is likely to change over time.

Each technique is presented with a description, example use cases, set of
limitations, list of related techniques, external sources (e.g. software
packages and tutorials) and further enriched with structured metadata (i.e.
tags).

In this paper we motivate and introduce the TEA techniques dataset, explaining
its contribution to the AI assurance ecosystem, and how we hope it will be
leveraged and enhanced by the AI community. Specifically, the TEA techniques
dataset has been designed with the following intended contributions in mind:

1. **A curated and structured dataset of AI assurance techniques** approximately
   100 AI assurance techniques with rich metadata, addressing the fragmentation
   of knowledge in this domain.
2. **An open, accessible platform** that provides both interactive web access
   and programmatic interfaces, facilitating integration into diverse
   practitioner workflows.
3. **A foundation for community-driven development** of AI assurance methods,
   with planned features for user contributions, extensibility, and
   collaborative refinement.

The remainder of this paper is organised as follows. Section 2 provides
background on AI assurance and reviews related work. Section 3 describes the TEA
Techniques dataset and the interactive web app. Section 4 details the
methodology and pipeline used to populate and assess the initial set of
resources from trusted sources. Section 5 explains the evaluation criteria for
technique selection. Section 6 covers implementation details. Section 7 presents
use cases and applications. Section 8 discusses future work and community
engagement plans. Finally, Section 9 concludes with reflections on the impact
and potential of this resource.

# Background and Related Work

The field of AI assurance has emerged from the convergence of multiple
disciplines, each contributing unique perspectives on how to ensure AI systems
operate in a way that promotes and builds trust. This section situates TEA
Techniques within the broader landscape of responsible AI initiatives, examining
existing frameworks, resources, and the specific gaps our work addresses.

## AI Assurance and Trustworthiness Frameworks

The concept of AI assurance draws heavily from established practices in
safety-critical systems engineering and safety case development. It is from this
context that argument-based assurance cases have long been used to demonstrate
system properties [@burr2022ethical].

<!-- Add more citations to GSN and York's work -->

These structured arguments link evidential artefacts (e.g. reports, test
results) to specific claims about some property of a system or process,
providing clear reasoning about how an overarching goal has been realised.
However, applying argument-based assurance to AI system design, development, and
deployment presents unique challenges due to several interlocking factors, such
as their probabilistic nature, opacity, and potential for emergent behaviours.

Several high-profile initiatives have attempted to establish guidance for
trustworthy AI, specifically using the language of _AI assurance_.

<!-- Add references to DSIT, CfA, Australian Government, Council of Europe -->

## Existing Technique Collections and Databases

Various efforts have been made to catalogue AI techniques relevant to assurance
goals.

### General Purpose Examples

1. The AI Incident Database documents failures and harms from deployed AI
   systems, providing valuable lessons but not proactive techniques for
   prevention.
2. The Partnership on AI's publication repository contains numerous reports and
   best practices, though these are primarily narrative documents rather than
   structured, actionable techniques.

<!-- Add OECD repository and research others -->

### Goal-Specific Examples

1. Commercial platforms like Google's What-If Tool and IBM's AI Fairness 360
   provide specific technical capabilities but are limited to their respective
   ecosystems and focus areas.
2. Academic surveys have attempted to systematise knowledge in specific
   domains—for instance, comprehensive reviews of explainable AI methods
   [@ribeiro2016should; @lundberg2017unified; @linardatos2020explainable] or
   fairness metrics [@mehrabi2019survey; @barocas2019fairness]. However, due to
   the nature of academic publications, these resources are static snapshots
   that will not keep pace with rapid technical developments.

<!-- Research and add more examples -->

## The Challenge of Resource Quality and Curation

A persistent challenge in the AI assurance ecosystem is the variable quality and
accessibility of resources. For instance, academic papers provide rigorous
foundations but may lack implementation details.[^exceptions] Whereas, code
repositories offer practical tools but may lack theoretical grounding or proper
documentation. The former may be useful for researchers who are looking to
explore and learn about narrowly focused techniques, but are unlikely to be of
much use to an AI practitioner within a commercial organisation who is hoping to
meet specific regulatory requirements for market approval or licensing.
Similarly, blog posts and tutorials can provide accessible explanations for
practitioners and professionals who are not expert in any one area, but are also
likely to oversimplify or misrepresent complex techniques (e.g. not presenting
limitations). This heterogeneity makes it difficult for AI practitioners to
identify trustworthy, relevant resources for their specific needs.

[^exceptions]: Add some notable exceptions

Previous attempts at systematic curation have typically relied on manual expert
review, which whilst ensuring quality, limits scalability and struggles with the
volume of new publications and tools. The exponential growth in AI research—with
thousands of new papers published monthly—makes purely manual curation
increasingly untenable. This motivates our hybrid approach combining automated
discovery with structured quality assessment.

## Gaps Addressed by TEA Techniques

Our analysis of the existing landscape revealed several critical gaps:

1. **Fragmentation across domains**: existing resources typically focus on
   single assurance goals (e.g., explainability or reliability) rather than
   providing integrated and systematic access to techniques spanning multiple
   objectives.

2. **Lack of structured metadata**: most technique descriptions lack consistent
   but flexible categorisation schemas (e.g. which models the technique is
   applicable to, which data types are valid, the lifecycle stages in which the
   technique should be used), and other dimensions crucial for practical
   selection.

3. **Missing quality indicators**: AI practitioners have limited information for
   assessing the maturity, reliability, and appropriateness of techniques for
   their contexts.

4. **Static documentation**: traditional publications and databases struggle to
   incorporate new techniques and update existing ones as the field evolves.

5. **Limited actionability**: academic surveys and framework documents, while
   comprehensive and rigorous, often lack the practical details needed for
   implementation (i.e. favouring high-level and widely applicable guidance that
   fails to offer sufficient specificity to end users).

By addressing these gaps through a combination of comprehensive curation,
systematic resource discovery, and accessible delivery mechanisms, the TEA
Techniques dataset seeks to provide a significant source of extensible value to
the broader community.

# TEA Techniques Dataset and App

The TEA Techniques dataset represents a carefully designed repository that seeks
to balance comprehensive coverage with practical usability. In this section, we
describe the structure of the dataset and the architecture of an interactive web
app for navigating the dataset.

## Structure of the TEA Techniques Dataset

<!-- Explain the structure of the dataset and give an illustrative example with corresponding code block and screenshot -->

### Technique Schema

Each technique in the database follows a consistent structure designed to
provide comprehensive yet accessible information:

```json
{
  "slug": "shapley-additive-explanations",
  "name": "SHapley Additive exPlanations",
  "description": "SHAP explains model predictions by quantifying how much each input feature contributes to the outcome...",
  "assurance_goals": ["Explainability", "Fairness", "Reliability"],
  "tags": [...],
  "example_use_cases": [...],
  "limitations": [...],
  "resources": [...],
  "complexity_rating": 4,
  "computational_cost_rating": 4
}
```

The **description** provides a clear, accessible explanation of the technique's
core concept and operation, avoiding excessive jargon whilst maintaining
technical accuracy. This enables stakeholders with varying technical backgrounds
to understand the technique's purpose and approach.

<!-- Add short summary paragraph on assurance goals but point to next sub-section -->

<!-- Add short summary paragraph on tags but point to later sub-section -->

**Example use cases** illustrate concrete applications across different domains,
helping practitioners envision how the technique might apply to their specific
contexts. Each use case is tied to a specific assurance goal, demonstrating the
evidence the technique can provide.

**Limitations** are explicitly documented as separate points, ensuring
practitioners understand the technique's constraints, assumptions, and potential
failure modes. This transparency is crucial for building robust assurance
arguments that acknowledge uncertainties.

**Resources** link to high-quality external materials including software
implementations, documentation, tutorials, and foundational papers. Each
resource includes a description and type classification, enabling targeted
exploration.

<!-- Reference later section explaining how initial set of resources was constructed -->

**Ratings** for complexity and computational cost provide quick indicators of
implementation difficulty and resource requirements, supporting feasibility
assessment during technique selection.

<!-- Note about need to refine these subjective ratings through community feedback mechanisms -->

### Core Assurance Goals

The primary means for organising the techniques is around 7 core assurance
goals, each addressing critical aspects of trustworthy and ethical AI:

- **Explainability**: techniques for understanding and interpreting AI system's
  and their behaviour, ranging from feature importance analysis to
  counterfactual generation. These techniques address a fundamental need to
  understand and explain how AI systems reach their decisions, and are essential
  for processes such as debugging, improvement, and stakeholder trust and
  engagement.
- **Fairness**: techniques for identifying, measuring, and mitigating various
  forms of bias and discrimination in AI systems and the data upon which they
  are trained. The techniques span lifecycle stages such as pre-processing,
  in-processing, and post-processing methods, as well as different types of
  fairness (e.g. group or individual).
- **Privacy**: techniques for protecting individual privacy while still enabling
  AI functionality, including differential privacy implementations, federated
  learning approaches, and privacy-preserving computation techniques.
- **Reliability**: techniques for ensuring consistent, dependable AI performance
  across diverse conditions or deployments, including robustness testing,
  uncertainty quantification, and failure mode analysis.
- **Safety**: techniques for preventing AI systems from causing harm (including
  physical, mental, socioeconomic, and environmental), such as adversarial
  testing, safety verification, and containment strategies for high-risk
  applications.
- **Transparency**: techniques for making AI systems and their developmental and
  organisational processes more open and understandable, including documentation
  standards, audit trails, and communication frameworks.

<!-- Add security -->

It is important to note, however, that while these core goals help direct the
focus of assurance cases, many techniques may serve multiple goals—especially in
the generation of evidential artefacts. For instance, model cards contribute to
both transparency and fairness by documenting system characteristics and
performance across different populations; integrated gradients can be used to
both interpret and explain predictions made by AI and also to improve safety and
reliability; and concept activation vectors can help identify sources of bias
due to the use of protected characteristics as well as more obvious
explainability and transparency purposed. The dataset seeks to capture these
cross-cutting relationships, enabling practitioners to identify techniques that
address multiple assurance objectives simultaneously.

### Tagging System

The database employs a flexible tagging system to help further organise
techniques into hierarchical categories. This enables more precise filtering and
discovery of techniques.

<!-- Explain tag-prefix system to set initial categories -->

- **applicable-models**: Specifies which model architectures the technique
  supports, from model-agnostic approaches to those specific to neural networks,
  tree-based models, or linear models.
- **assurance-goal-category**: Provides fine-grained categorisation within each
  assurance goal, such as
  "explainability/feature-analysis/importance-and-attribution" or
  "fairness/measurement/statistical-parity".
- **data-requirements**: Indicates special data needs such as labelled data,
  temporal sequences, or specific preprocessing requirements.
- **data-type**: Specifies applicable data modalities including tabular, text,
  image, time-series, and multimodal data.
- **evidence-type**: Categorises the type of output produced, such as
  quantitative metrics, visualisations, formal proofs, or qualitative reports.
- **expertise-needed**: Indicates required knowledge domains like statistics,
  causal inference, or specific technical frameworks.
- **explanatory-scope**: Distinguishes between local (instance-level) and global
  (model-level) explanation techniques.
- **lifecycle-stage**: Maps techniques to AI development phases from data
  preparation through deployment and monitoring.
- **technique-type**: Classifies the nature of the technique as algorithmic,
  analytical, operational, or procedural.

<!-- Convert above list into a table, with an extra column showing a few examples of actual tags. But point to full details on web app (https://alan-turing-institute.github.io/tea-techniques/about/tag-definitions/)-->

Additional category-specific tags capture unique dimensions. For instance,
fairness techniques include tags for individual vs. group fairness approaches,
while explainability techniques distinguish between local or global explanation
strategies.[^local_vs_global]

[^local_vs_global]: Explain distinction between local and global explanations.

This tagging system has been designed to enable precise search and filtering
functionality, helping to reveal relationships between techniques. However,
unlike a more rigid schema, it also is intended to be updated and enhanced over
time (e.g. adding new categories and tags). Possible future options could
include a ranking system of popular tags, or merging and splitting of tags that
are under- or over-used.

### Evaluation Criteria

So far we have set aside the question of "what is a technique?"

However, this is an important question to address, as the answer can also be
used as a means to demarcate relevant from non-relevant techniques, or to
exclude ill-defined or poor quality methods.

In the context of the TEA Techniques dataset and web app, a "technique" is
defined as a **concrete method that produces tangible evidence for AI assurance
claims**. This definition deliberately excludes abstract principles, high-level
guidelines, or purely theoretical constructs that lack practical implementation
methods.

#### Core Requirements for Techniques

Each technique in our database must satisfy four foundational criteria:

1. **Evidence Generation**: The technique must produce specific outputs
   (metrics, visualisations, reports, proofs) that can serve as evidence within
   argument-based assurance frameworks. For example, SHAP produces feature
   attribution values that evidence explainability claims.

2. **Practical Applicability**: Practitioners with appropriate expertise must be
   able to implement the technique using available tools and resources. We
   include emerging techniques if they have reference implementations or
   detailed methodological descriptions.

3. **Direct Relevance**: The technique must explicitly address one or more of
   our six assurance goals (explainability, fairness, privacy, reliability,
   safety, transparency). Tangentially related methods are excluded unless they
   produce evidence directly supporting these goals.

4. **Quality Threshold**: Techniques must demonstrate sufficient maturity
   through peer review, empirical validation, or substantial community adoption.
   Experimental methods may be included with appropriate caveats if they show
   significant promise.

#### Evaluation Framework

We evaluate candidate techniques across eight dimensions to ensure consistent
quality and relevance:

- **Goal alignment**: How directly the technique addresses assurance objectives
- **Evidence type**: The nature and strength of outputs produced (quantitative
  metrics, visualisations, formal proofs)
- **Applicability scope**: Model types, data formats, and lifecycle stages where
  the technique applies
- **Maturity level**: Publication record, empirical validation, and community
  adoption
- **Resource requirements**: Computational costs, data needs, and expertise
  prerequisites
- **Actionability**: How readily outputs translate into concrete decisions or
  interventions
- **Limitations**: Documented assumptions, failure modes, and scope boundaries
- **Specificity**: The technique's precision in addressing particular assurance
  challenges

This multi-dimensional evaluation ensures the database includes techniques that
are both theoretically sound and practically valuable, supporting evidence-based
approaches to responsible AI development across diverse contexts and
applications.

## Architecture and Design Principles of the Interactive App

While there may be value in the raw JSON file for some practitioners, this
format is not suitable for others. And, as one of our key goals was to widen
participation in the AI assurance ecosystem, we decided to develop an
interactive platform for navigating this dataset.

The interactive web app's architecture reflects several key design principles:

- **Practitioner-centricity**: we aim to prioritise the needs of practitioners
  who must select and implement techniques in real-world contexts.
- **Evidence-orientation**: techniques are presented as means for supporting
  evidence generation—specifically (but not solely) in the production of
  assurance cases.
- **Comprehensive and extensible metadata**: structured metadata and flexible
  tagging enables multi-dimensional filtering of the dataset (e.g. applicable
  model type, data characteristics, expertise needed, and lifecycle stage).
- **Usability and Transparency**: clear documentation of technique limitations,
  requirements, and complexity indicators help practitioners make informed
  decisions about techniques prior to selection or adoption.

<!-- Explain the structure and functionality of the web app, noting why a static-site and GitHub hosting were chosen (i.e. to keep the app open and accessible, and to help ensure sustainable access to software (i.e. minimising expensive cloud architecture that would force community-centred app to become monetised)) -->

# Technique and Resource Discovery

## Initial Set of Techniques

<!-- Explain non-systematic method for establishing initial set (i.e. internal testing and feedback) -->

## Resource Discovery Pipeline

The longer term value of the TEA Techniques dataset and app will depend upon a)
ongoing maintenance by the core team, and b) how well it serves the need of an
engaged community. For instance, promoting submission of new techniques by
members of the AI assurance ecosystem; encouraging active discussion and
feedback around content quality; and maintaining core architecture and
reliability.

<!-- Note importance of active community participation and engagement for other digital media or commons projects -->

However, all community-centred projects need an initial starting point to help
found an active community of practice. To that end, we carried out a systematic
search for an initial set of resources to support the preliminary techniques.

In this section we explain the methodology and tooling used to support the
systematic identification, evaluation, and categorisation of supporting
resources.

### Pipeline Overview

The resource discovery pipeline we used followed a seven-stage sequential
processing model, summarised in Table 1.

| Stage       | Purpose                | Key Activities                                                                                                                               |
| ----------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| PREPARE     | Query Generation       | Prepares `techniques.json` (e.g. title, acronyms) into platform-specific search for individual queries                                       |
| SEARCH      | Multi-Source Discovery | Searches 5 platforms (arXiv, GitHub, Semantic Scholar, CORE, Google CSE) for up to 75 candidates per technique, applying heuristic filtering |
| RANK        | Quality Selection      | Applies 6-factor scoring to select top 5-10 resources per technique                                                                          |
| EVALUATE    | LLM Assessment         | Uses a LLM to evaluate and score resources for relevance and refine classifications (e.g. tutorial, software package, journal article)       |
| VALIDATE    | Accessibility Check    | Verifies URLs are accessible and extracts proper metadata                                                                                    |
| DEDUPLICATE | Remove Redundancy      | Eliminates any duplicate resources (e.g. from CORE and Semantic Scholar) through URL and content comparison                                  |
| SAVE        | Persistent Storage     | Stores final curated resources with full audit trail                                                                                         |

### Prepare and Search

Because each technique was run individually due to limits on API access for the
search repositories, the initial PREPARE stage comprised a simple data
processing step, extracting relevant data (e.g. title, acronym, description)
from the original `techniques.json` file.

The SEARCH stage is particularly important as it queries five distinct
repositories to ensure comprehensive coverage:

- **Academic sources** (arXiv, Semantic Scholar, CORE): Up to 45 papers focusing
  on theoretical foundations and peer-reviewed research
- **GitHub**: Up to 10 well-maintained repositories (minimum 10 stars) for
  practical implementations
- **Google Custom Search**: Up to 20 web resources including tutorials and
  documentation from relevant sites (e.g. HuggingFace, Readthedocs.io, Kaggle,
  Towards Data Science)

This multi-source approach typically yields 30-75 initial candidates per
technique, which are then balanced to ensure diversity across resource types and
sources.

### LLM Evaluation and Ranking

The EVALUATE and RANK stages leverage large language models (specifically
Anthropic's Claude Sonnet 3.7) to ensure only pertinent results advance through
the pipeline. This approach was designed to a) automate the process of resource
discovery at scale, and b) minimise false positives that traditional keyword
matching produces.

For instance, searches for "SHAP" (i.e. Shapley Additive Explanations) would
often return results about the popular "Shapez" video game. Using LLM evaluation
effectively filtered out such irrelevant matches, while preserving genuinely
related resources about SHAP (SHapley Additive exPlanations). All original
search results were saved to enable manual verification of the filtering
process.

For the RANK stage, the pipeline applied a six-factor quality scoring system
that considers source credibility (30%), content recency (20%),
popularity/impact (20%), and other quality metrics. This also helped constrain
the LLM decision-making to minimise inaccuracies.

### Validation and SAVE

The VALIDATE and SAVE stages ensured all selected resources were accessible,
following redirect chains and verifying content availability. This prevents the
inclusion of dead links or resources that have moved, maintaining the dataset's
reliability for end users.

### Human Review Process

Because of the use of LLM-powered evaluation and ranking, after the automated
pipeline processed the initial set of 92 techniques, **all of the resources**
were manually reviewed by a human to ensure that they were relevant to the
respective technique. This final assurance step is an important first quality
gate, but as we will discuss later, there are additional plans for implementing
community feedback mechanisms to further enhance the quality of resources.

## Results and Impact

The pipeline's systematic approach transformed an initial pool of approximately
2,760-6,900 candidate resources (30-75 per technique across 92 techniques) into
a carefully curated dataset of ~360 high-quality resources. This represents an
average of approximately 4 resources per technique, with each resource verified
for accessibility, relevance, and quality through both automated scoring and
human review.

# Web Application Technical Details

TEA Techniques employs a static site generation (SSG) architecture using
Next.js 14.

## Static Data Generation

The build process transforms the master `techniques.json` file into optimised
data structures for different access patterns:

- **Individual technique files**: Each technique gets a dedicated JSON file
  enabling direct access without parsing the entire dataset.
- **Category indices**: Pre-computed lists of techniques for each assurance
  goal, tag, and tag combination reduce client-side filtering.
- **Metadata aggregation**: Statistics, tag counts, and relationship mappings
  are pre-calculated for immediate display.

## TEA Techniques "API"

Despite being a static site, TEA Techniques provides API-like access to data.

<!-- Rewrite this subsection without using bullet-points -->

- **Direct JSON access**: All generated JSON files are publicly accessible:

```
/data/techniques.json                    # All techniques
/data/techniques/[slug].json            # Individual technique
/data/categories/[goal]/techniques.json # Techniques by goal
/data/tags/[tag]/techniques.json        # Techniques by tag
```

- **Versioning strategy**: URL structure supports future versioning without
  breaking existing integrations.

- **Development Support**: Docker compose file available on GitHub to enable
  consistent development experience for community.

- **Clear Documentation**: Documentation and About pages on web app explain key
  concepts and how the web app functions.

**No personal tracking**: The platform avoids cookies and personal identifiers.

# Use Cases and Applications

The true value of TEA Techniques emerges through its application in real-world
scenarios. In this section, we propose a couple of possible use cases and
workflows, demonstrating how the platform could be leveraged to support AI
assurance activities in different settings.

## Practitioner Workflows

Development teams building AI systems face constant decisions about which
assurance techniques to implement. TEA Techniques supports their workflow
through several mechanisms:

**Technique selection during design**: Teams can filter techniques by lifecycle
stage to identify relevant methods for their current phase. For instance, a team
designing a loan approval system might filter for fairness techniques applicable
during model development, discovering options like fairness-aware preprocessing,
in-processing constraints, and post-processing calibration.

**Implementation guidance**: Each technique's resources section provides
immediate access to code libraries and implementation guides. A team
implementing SHAP explanations can quickly find the official library,
integration examples for their framework (TensorFlow, PyTorch, scikit-learn),
and tutorials addressing common pitfalls.

**Cross-functional collaboration**: The accessible technique descriptions enable
productive conversations between technical and non-technical team members.
Product managers can understand the evidence each technique provides, whilst
engineers focus on implementation details.

## Regulatory Compliance and Risk Officers

Organisations must demonstrate their AI systems meet regulatory requirements and
organisational policies:

**Regulatory alignment**: Techniques can be mapped to specific regulatory
requirements. For instance, GDPR's requirement for meaningful explanations
aligns with local explanation techniques, whilst fairness regulations map to
statistical parity tests and disparate impact assessments.

**Risk assessment**: The limitations and assumptions documented for each
technique help risk officers understand potential gaps in their assurance
approach. Knowing that LIME assumes local linearity, for example, prompts
consideration of complementary techniques for highly non-linear models.

**Policy development**: The comprehensive technique inventory informs
organisational policy development by revealing the art of the possible—what
types of assurance evidence can reasonably be required given available methods.

## AI Research Projects

TEA Techniques serves as a comprehensive resource for both education and
research. For instance, instructors can structure courses around the six
assurance goals, using the database to ensure comprehensive coverage of
available techniques. Students can implement and compare different techniques
using the provided resources, moving beyond theoretical discussion to hands-on
experience. And, researchers can identify gaps in the current technique
landscape as starting points for research projects or dissertations.

<!-- Suggest how the dataset itself, as a community of practice forms and starts showing how techniques are being used, could itself become a useful research data repository for new programmes of research. -->

**Self-paced learning**: The web interface supports individual exploration,
whilst the structured content enables systematic skill development.

**Certification preparation**: Professional certifications in AI governance and
ethics can reference TEA Techniques as a comprehensive study resource.

# Community Engagement, Extensibility, and Future Work

## Community Engagement

The launch of TEA Techniques represents not an endpoint but the beginning of a
community-driven evolution in AI assurance practice.

The static architecture, while providing numerous benefits, also presents some
barriers to direct user contributions.

<!-- Explain plan to use GitHub Issues and PRs to manage submissions and revisions, but this can be revisited at a later date. -->

**Quality assurance pipeline**: Submitted techniques will undergo automated
validation checking completeness, format compliance, and basic quality
indicators before human review. The existing evaluation criteria will guide
acceptance decisions.

**Attribution and recognition**: Contributors will receive proper attribution,
with potential for highlighted contributor profiles showcasing their expertise
and contributions to the AI assurance community.

## Extensibility

<!-- Mention extensibility and integration of platform, focusing on the immediate plan to integrate with the TEA Platform (https://github.com/alan-turing-institute/AssurancePlatform) by enabling users to "discover" techniques during the production of an assurance case, as well as to discover how others have used specific techniques in their own assurance cases -->

### Standards Alignment

Active engagement with standardisation efforts:

**ISO/IEC collaboration**: Alignment with emerging AI standards (ISO/IEC
23053, 23894) ensuring technique categorisations support compliance
demonstration.

**Regulatory mapping**: Explicit mapping between techniques and regulatory
requirements across jurisdictions, supporting global compliance efforts.

**Industry frameworks**: Integration with industry-specific frameworks (IEEE,
partnership on AI) promoting consistent terminology and approach.

## Future Plans

### Enhanced Search and Discovery

Current search capabilities, whilst functional, have room for significant
enhancement:

- **Semantic search**: Integration of embedding-based search will enable
  conceptual queries—finding techniques similar to a described need rather than
  relying on keyword matching.
- **Faceted exploration**: Advanced filtering interfaces will support complex
  queries combining multiple criteria with AND/OR logic, enabling precise
  technique discovery for specific contexts.

### Interactive Features

Possible features for enabling greater interactivity and usability could
include:

- **Technique comparison tools**: Side-by-side comparison interfaces will help
  users evaluate trade-offs between similar techniques, with visualisations
  highlighting key differences.
- **Decision support wizards**: Interactive questionnaires will guide users
  through technique selection based on their specific context, constraints, and
  objectives.
- **Integration playgrounds**: Sandbox environments could allow users to
  experiment with technique implementations using sample datasets, lowering
  barriers to adoption.

### Content Expansion

As AI technology evolves, new techniques will emerge as will new categories.
There are currently many gaps in our dataset, as well as significant imbalance
between categories.

<!-- Note how explainability and fairness techniques dominate in comparison to others, such as security -->

Techniques specific to large language models, image generators, and other
generative systems require dedicated coverage addressing unique challenges like
hallucination detection and prompt injection prevention.

Domain-specific technique collections could also be added to help address sector
needs (e.g. healthcare AI assurance techniques addressing clinical validation,
patient safety, and regulatory compliance specific to medical AI applications).

And, finally, expanding access to a global audience requires multilingual
capabilities (e.g. interface localisation, technique translation, and regional
resource curation).]

### Open Challenges

<!-- Expand on the following open challenges -->

**Technique obsolescence**: Developing clear criteria and processes for
deprecating outdated techniques whilst preserving historical context.

**Quality vs. inclusivity**: Balancing rigorous quality standards with the need
to document emerging or experimental techniques. Perhaps adding a
community-based "maturity" score.

**Reliable Evaluation metrics**: Establishing standardised ways to measure and
compare metrics, such as complexity or computational cost.

# Conclusion

The TEA Techniques platform represents a significant step forward in widening
access and participation in the AI assurance ecosystem. By combining technique
curation with systematic resource discovery and accessible delivery mechanisms,
we have aimed to create a community-centred resource that bridges the gap
between high-level principles and practical implementation.

The impact of the dataset and web app impact extends across multiple dimensions.
For practitioners, it provides immediate access to _actionable techniques_ with
clear guidance and documentation. For researchers, it offers a structured
landscape of existing methods, and the possibility of a community-driven
repository that could offer additional research opportunities (e.g. which
resources are highly used, where are there current gaps to be addressed). For
educators and policymakers, it supplies concrete examples of what AI assurance
entails, moving beyond abstract and high-level frameworks to specific,
implementable methods.

Our resource discovery pipeline offers an early demonstration of how LLM-powered
automation and human judgment can be combined effectively to manage information
at scale. The programmatic filtering combined with the stochastic LLM-based
evaluation process ensure that practitioners receive not just any resources, but
those most likely to support successful technique implementation. This
methodology could be adapted to other domains facing similar challenges of
information overload and quality uncertainty.

Perhaps most importantly, the TEA Techniques dataset embodies the philosophy of
openness and accessibility---aiming to lower barriers to trustworthy and ethical
AI assurance. The platform's current set of 92 techniques provides a solid
foundation, but its true potential lies in supporting a flourishing community of
practice. As practitioners apply techniques and share experiences, as
researchers develop new methods, and as regulations evolve to require specific
assurances, the TEA Techniques dataset will grow to meet these needs.
