import { Users } from "lucide-react";

export default function CommunityContributionsPage() {
  return (
    <div className="space-y-8 py-4">
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          How to Contribute
        </h2>
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <p className="mb-4">
            Contributions to the TEA Techniques Database are welcome!
            Here&apos;s how you can contribute:
          </p>
          <ol className="space-y-4">
            <li className="flex gap-3 items-start">
              <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold mt-0.5">
                1
              </span>
              <div>
                <strong className="text-primary">
                  Fork the repository on GitHub
                </strong>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold mt-0.5">
                2
              </span>
              <div>
                <strong className="text-primary">
                  Create your feature branch
                </strong>
                <p className="text-sm text-muted-foreground mt-1">
                  git checkout -b feature/amazing-feature
                </p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold mt-0.5">
                3
              </span>
              <div>
                <strong className="text-primary">Commit your changes</strong>
                <p className="text-sm text-muted-foreground mt-1">
                  git commit -m &apos;Add some amazing feature&apos;
                </p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold mt-0.5">
                4
              </span>
              <div>
                <strong className="text-primary">Push to the branch</strong>
                <p className="text-sm text-muted-foreground mt-1">
                  git push origin feature/amazing-feature
                </p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold mt-0.5">
                5
              </span>
              <div>
                <strong className="text-primary">Open a Pull Request</strong>
                <p className="text-sm text-muted-foreground mt-2">
                  Please ensure your code follows the project&apos;s coding
                  standards and includes appropriate tests.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <div className="h-6 w-6 text-primary">⚡</div>
          Adding New Techniques
        </h2>
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <p className="mb-4">
            The database of techniques can be expanded in several ways:
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-2">
              <div className="h-5 w-5 text-primary flex-shrink-0 mt-0.5">→</div>
              <div>
                <strong>Through the UI</strong>: Once logged in with appropriate
                permissions, you can use the &quot;Add New Technique&quot; form.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-5 w-5 text-primary flex-shrink-0 mt-0.5">→</div>
              <div>
                <strong>Via JSON modifications</strong>: The backend includes a
                directory where the dataset is stored as a single JSON file,
                which can be re-imported.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-5 w-5 text-primary flex-shrink-0 mt-0.5">→</div>
              <div>
                <strong>API Endpoints</strong>: You can programmatically add
                techniques using the REST API.
              </div>
            </li>
          </ul>
          <p className="mt-4">
            When adding a new technique, please ensure you provide comprehensive
            information, including:
          </p>
          <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 pl-6 list-disc">
            <li>Clear name and description</li>
            <li>Relevant assurance goals and categories</li>
            <li>Implementation details</li>
            <li>Example use cases</li>
            <li>Limitations</li>
            <li>References or resources</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Community Guidelines
        </h2>
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <p className="mb-4">
            To maintain the quality and usefulness of the TEA Techniques
            Database, please follow these guidelines:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <div className="h-5 w-5 text-primary flex-shrink-0 mt-0.5">→</div>
              <span>Provide accurate and verifiable information</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-5 w-5 text-primary flex-shrink-0 mt-0.5">→</div>
              <span>Be respectful and constructive in discussions</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-5 w-5 text-primary flex-shrink-0 mt-0.5">→</div>
              <span>Follow the code of conduct</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-5 w-5 text-primary flex-shrink-0 mt-0.5">→</div>
              <span>Respect intellectual property rights</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-5 w-5 text-primary flex-shrink-0 mt-0.5">→</div>
              <span>Use inclusive language</span>
            </li>
          </ul>
          <p className="mt-4">
            We aim to create a welcoming and productive community that advances
            the field of responsible AI development.
          </p>
        </div>
      </section>
    </div>
  );
}
