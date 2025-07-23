import { Code } from "lucide-react";

export default function DeveloperInstructionsPage() {
  return (
    <div className="space-y-8 py-4">
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Code className="h-6 w-6 text-primary" />
          Development Setup
        </h2>
        <div className="bg-card rounded-lg border shadow-sm p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <div className="h-5 w-5 text-primary">⚡</div>
              Prerequisites
            </h3>
            <p className="text-muted-foreground mb-2">
              This project uses uv for Python dependency management. If you
              don&apos;t have uv installed, follow the installation
              instructions.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <div className="h-5 w-5 text-primary">📁</div>
              SQLite Setup (Quick Start for Development)
            </h3>
            <ol className="mt-4 space-y-4">
              <li className="flex gap-3">
                <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-primary">Clone the repository</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    git clone https://github.com/chrisdburr/tea-techniques.git
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-primary">
                    Setup environment variables
                  </strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    Copy .env.example to .env and adjust values as needed
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-primary">Set up the backend</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    cd backend && uv sync && USE_SQLITE=True uv run python
                    manage.py reset_and_import_techniques
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold flex-shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong className="text-primary">Run the backend</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    USE_SQLITE=True uv run python manage.py runserver
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold flex-shrink-0 mt-0.5">
                  5
                </span>
                <div>
                  <strong className="text-primary">
                    Set up and run the frontend
                  </strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    cd frontend && npm install && npm run dev --turbopack
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <div className="h-6 w-6 text-primary">📁</div>
          Project Structure
        </h2>
        <div className="bg-card rounded-lg border shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Backend</h3>
              <p className="text-muted-foreground mb-2">
                Django with Django REST Framework
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <code className="bg-muted px-2 py-1 rounded text-primary font-mono">
                    backend/api
                  </code>{" "}
                  - Main Django app
                </li>
                <li>
                  <code className="bg-muted px-2 py-1 rounded text-primary font-mono">
                    backend/config
                  </code>{" "}
                  - Django project settings
                </li>
                <li>
                  <code className="bg-muted px-2 py-1 rounded text-primary font-mono">
                    backend/data
                  </code>{" "}
                  - JSON file and schema for techniques
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Frontend</h3>
              <p className="text-muted-foreground mb-2">
                Next.js with TypeScript and Tailwind CSS
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <code className="bg-muted px-2 py-1 rounded text-primary font-mono">
                    frontend/src/app
                  </code>{" "}
                  - Next.js pages and routes
                </li>
                <li>
                  <code className="bg-muted px-2 py-1 rounded text-primary font-mono">
                    frontend/src/components
                  </code>{" "}
                  - Reusable React components
                </li>
                <li>
                  <code className="bg-muted px-2 py-1 rounded text-primary font-mono">
                    frontend/src/lib
                  </code>{" "}
                  - Utilities, types, and API clients
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
