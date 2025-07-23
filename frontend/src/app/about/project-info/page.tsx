import { BookOpen } from "lucide-react";

export default function ProjectInfoPage() {
  return (
    <div className="space-y-8 py-4">
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Project Overview
        </h2>
        <div className="prose max-w-none bg-card rounded-lg p-6 border shadow-sm">
          <p>
            The TEA Techniques Database is an interactive repository designed to
            work in conjunction with the
            <a
              href="https://assuranceplatform.azurewebsites.net/"
              className="text-primary hover:underline"
            >
              {" "}
              Trustworthy and Ethical Assurance (TEA) platform
            </a>{" "}
            as a core plugin to enable practitioners to identify and implement
            appropriate assurance methods.
          </p>
          <br />
          <p>
            This database provides a structured way to explore and understand
            various techniques for evidencing claims about responsible AI
            design, development, and deployment. By organizing techniques by
            assurance goals, categories, and subcategories, it helps
            practitioners find exactly what they need for their specific use
            cases.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <div className="h-6 w-6 text-primary">⚡</div>
          Key Features
        </h2>
        <div className="prose max-w-none bg-card rounded-lg p-6 border shadow-sm">
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <div className="h-5 w-5 text-primary flex-shrink-0 mt-0.5">→</div>
              <div>
                <strong>Structured Documentation</strong>: Each technique
                includes comprehensive information about its purpose,
                implementation details, and practical use cases.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-5 w-5 text-primary flex-shrink-0 mt-0.5">→</div>
              <div>
                <strong>Categorized Organization</strong>: Techniques are
                organized by assurance goals, categories, and subcategories to
                help you find exactly what you need.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-5 w-5 text-primary flex-shrink-0 mt-0.5">→</div>
              <div>
                <strong>API Access</strong>: Access all data through a
                comprehensive REST API with documentation via Swagger.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-5 w-5 text-primary flex-shrink-0 mt-0.5">→</div>
              <div>
                <strong>Model Agnostic & Specific</strong>: Browse techniques
                that work across different model types or that are designed for
                specific model architectures.
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
