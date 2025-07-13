import { ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";

export default function TechniqueEvaluationContent() {
  return (
    <div className="space-y-8 py-4">
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-primary" />
          Technique Evaluation Criteria
        </h2>
        <div className="prose max-w-none bg-card rounded-lg p-6 border shadow-sm space-y-6">
          <p>
            This document outlines the criteria used to evaluate and select
            techniques for inclusion in the Trustworthy and Ethical Assurance
            (TEA) Techniques database. The goal is to create a curated,
            high-quality resource that helps practitioners build robust
            assurance cases for their AI systems.
          </p>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              What is a &quot;Technique&quot; in this Context?
            </h3>
            <p>
              A <strong>technique</strong> refers to a specific method, tool,
              process, algorithm, or approach used to generate evidence about
              the properties of an AI system. These properties align with core
              TEA goals such as Explainability, Fairness, Privacy, Reliability,
              Safety, and Transparency.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Evaluation Criteria</h3>
            <div className="grid gap-4">
              {[
                {
                  title: "Relevance to Assurance Goals",
                  description:
                    "Does the technique directly address one or more core TEA goals (Explainability, Fairness, Privacy, Reliability, Safety, Transparency)?",
                },
                {
                  title: "Nature of Evidence Provided",
                  description:
                    "What kind of output does the technique produce (quantitative metrics, visualizations, reports, formal proofs)?",
                },
                {
                  title: "Applicability & Scope",
                  description:
                    "Model dependency, data type compatibility, lifecycle stage, and scope of explanation/analysis.",
                },
                {
                  title: "Maturity and Validity",
                  description:
                    "Is the technique well-established in research or practice? Is there empirical or theoretical evidence supporting its effectiveness?",
                },
                {
                  title: "Practicality & Resource Requirements",
                  description:
                    "Complexity, computational cost, data requirements, and expertise needed for implementation.",
                },
                {
                  title: "Interpretability & Actionability",
                  description:
                    "How easy is it for stakeholders to understand the technique's output and translate results into actionable steps?",
                },
                {
                  title: "Limitations and Assumptions",
                  description:
                    "Are the known limitations, weaknesses, and underlying assumptions well-documented?",
                },
                {
                  title: "Availability of Tooling & Resources",
                  description:
                    "Are there readily available software libraries, implementations, or detailed tutorials?",
                },
              ].map((criterion, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg"
                >
                  <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="font-semibold text-primary mb-1">
                      {criterion.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {criterion.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-primary" />
          Why Have Evaluation Criteria?
        </h2>
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <p className="mb-4">
            Having clear, well-defined criteria for inclusion serves several
            crucial purposes:
          </p>
          <ul className="space-y-3">
            {[
              "Quality Control: Ensures that the techniques listed are relevant, credible, and useful for building assurance cases.",
              "Consistency: Provides a standardized framework for evaluating diverse techniques, leading to a more coherent dataset.",
              "Scope Management: Helps define the boundaries of the dataset, preventing the inclusion of irrelevant or poorly defined methods.",
              "User Trust: Builds confidence for users that the techniques presented have met a certain standard of relevance and utility for TEA purposes.",
              "Contribution Guidance: Offers clear guidelines for community members who wish to suggest new techniques for inclusion.",
            ].map((purpose, index) => (
              <li key={index} className="flex items-start gap-2">
                <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>{purpose}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
