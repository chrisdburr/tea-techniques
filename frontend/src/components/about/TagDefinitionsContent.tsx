import { Tag, Hash, Layers, Users } from "lucide-react";
import { PrismCodeBlock as CodeBlock } from "@/components/ui/prism-code-block";

export default function TagDefinitionsContent() {
	return (
		<div className="space-y-8 py-4">
			<section>
				<h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
					<Tag className="h-6 w-6 text-primary" />
					Tag Structure and Format
				</h2>
				<div className="prose max-w-none bg-card rounded-lg p-6 border shadow-sm space-y-6">
					<p>
						Tags follow a hierarchical structure using forward slashes (<code>/</code>) as separators 
						and must contain at least one prefix. This system provides good coverage of technique 
						properties based on the TEA evaluation criteria.
					</p>

					<div className="space-y-4">
						<h3 className="text-lg font-semibold">Format Rules</h3>
						<ul className="space-y-2">
							<li><strong>Prefix:</strong> Indicates the broad classification scheme (e.g., <code>assurance-goal-category</code>). Prefixes are mandatory.</li>
							<li><strong>Tag Content:</strong> Represents the specific content for the tag within the prefix, potentially including sub-topics.</li>
							<li><strong>Case:</strong> All parts must be <strong>lowercase</strong> and use <strong>hyphens</strong> (<code>-</code>) instead of spaces or underscores.</li>
						</ul>

						<div className="bg-muted/50 p-4 rounded-lg">
							<p className="text-sm font-semibold mb-2">Example:</p>
							<CodeBlock
								language="text"
								code="assurance-goal-category/explainability/feature-analysis/importance-attribution"
							/>
						</div>
					</div>
				</div>
			</section>

			<section>
				<h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
					<Hash className="h-6 w-6 text-primary" />
					Defined Prefixes
				</h2>
				<div className="space-y-6">
					{[
						{
							prefix: "assurance-goal-category",
							description: "Provides specific classifications for assurance goals",
							examples: [
								"explainability/feature-analysis/importance-attribution",
								"fairness/group/statistical-parity",
								"privacy/formal-guarantee/differential-privacy"
							]
						},
						{
							prefix: "applicable-models",
							description: "Indicates the types of models to which the technique is applicable",
							examples: [
								"agnostic",
								"neural-network",
								"transformer",
								"tree-based"
							]
						},
						{
							prefix: "lifecycle-stage",
							description: "Indicates the typical project lifecycle stage(s) for application",
							examples: [
								"model-development/training",
								"system-deployment-and-use/monitoring",
								"data-handling/preprocessing"
							]
						},
						{
							prefix: "expertise-needed",
							description: "Indicates the type of knowledge or expertise typically required",
							examples: [
								"statistics",
								"causal-inference",
								"domain-knowledge",
								"low"
							]
						},
						{
							prefix: "evidence-type",
							description: "Indicates the nature of the output or evidential artifact produced",
							examples: [
								"quantitative-metric",
								"visualization",
								"qualitative-report",
								"statistical-test"
							]
						},
						{
							prefix: "data-requirements",
							description: "Indicates specific data needs or dependencies for the technique",
							examples: [
								"labelled-data",
								"access-to-model-internals",
								"sensitive-attributes",
								"no-special-requirements"
							]
						}
					].map((category, index) => (
						<div key={index} className="bg-card rounded-lg border shadow-sm p-6">
							<h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
								<code className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
									{category.prefix}
								</code>
							</h3>
							<p className="text-muted-foreground mb-4">{category.description}</p>
							<div className="space-y-2">
								<p className="text-sm font-semibold">Examples:</p>
								<div className="grid gap-2">
									{category.examples.map((example, exampleIndex) => (
										<code key={exampleIndex} className="bg-muted px-3 py-2 rounded text-sm block">
											{category.prefix}/{example}
										</code>
									))}
								</div>
							</div>
						</div>
					))}
				</div>
			</section>

			<section>
				<h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
					<Layers className="h-6 w-6 text-primary" />
					Additional Tag Categories
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{[
						{
							title: "Explanatory Scope",
							prefix: "explanatory-scope",
							options: ["local", "global"]
						},
						{
							title: "Fairness Approach",
							prefix: "fairness-approach",
							options: ["group", "individual", "causal"]
						},
						{
							title: "Data Type",
							prefix: "data-type",
							options: ["tabular", "text", "image", "time-series", "any"]
						},
						{
							title: "Technique Type",
							prefix: "technique-type",
							options: ["algorithmic", "procedural", "documentation", "metric"]
						}
					].map((category, index) => (
						<div key={index} className="bg-card rounded-lg border shadow-sm p-4">
							<h3 className="font-semibold mb-2">{category.title}</h3>
							<code className="bg-primary/10 text-primary px-2 py-1 rounded text-sm mb-3 inline-block">
								{category.prefix}
							</code>
							<div className="space-y-1">
								{category.options.map((option, optionIndex) => (
									<div key={optionIndex} className="text-sm bg-muted/50 px-2 py-1 rounded">
										{option}
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</section>

			<section>
				<h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
					<Users className="h-6 w-6 text-primary" />
					Governance Plan
				</h2>
				<div className="bg-card rounded-lg border shadow-sm p-6 space-y-6">
					<div>
						<h3 className="text-lg font-semibold mb-3">Principles</h3>
						<ul className="space-y-2">
							<li><strong>Consistency:</strong> Tags should be applied uniformly across all techniques.</li>
							<li><strong>Clarity:</strong> Tag definitions must be clear and unambiguous.</li>
							<li><strong>Relevance:</strong> Tags should accurately reflect the technique's properties and align with the evaluation criteria.</li>
							<li><strong>Evolution:</strong> The tag system should be adaptable to new techniques and evolving concepts in TEA.</li>
						</ul>
					</div>

					<div>
						<h3 className="text-lg font-semibold mb-3">Adding/Modifying Tags & Prefixes</h3>
						<ol className="space-y-3">
							<li className="flex gap-3">
								<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold flex-shrink-0 mt-0.5">1</span>
								<div>
									<strong>Proposal:</strong> Open a GitHub Issue or Discussion thread outlining the proposal and justification.
								</div>
							</li>
							<li className="flex gap-3">
								<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold flex-shrink-0 mt-0.5">2</span>
								<div>
									<strong>Discussion:</strong> The team discusses the proposal, considering necessity, clarity, and potential overlap.
								</div>
							</li>
							<li className="flex gap-3">
								<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold flex-shrink-0 mt-0.5">3</span>
								<div>
									<strong>Approval:</strong> Consensus is sought for approval before proceeding to documentation.
								</div>
							</li>
							<li className="flex gap-3">
								<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold flex-shrink-0 mt-0.5">4</span>
								<div>
									<strong>Documentation Update:</strong> Create a PR to update the TAG-DEFINITIONS.md document.
								</div>
							</li>
						</ol>
					</div>
				</div>
			</section>
		</div>
	);
}