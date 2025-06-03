import { BookOpen, Code, Users, FileText, Hash } from "lucide-react";
import TechniqueEvaluationContent from "./TechniqueEvaluationContent";
import TagDefinitionsContent from "./TagDefinitionsContent";

// Tab configuration for easy extension
export interface TabConfig {
	id: string;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	content: React.ComponentType;
}

export const aboutTabs: TabConfig[] = [
	{
		id: "project-info",
		label: "Project Information",
		icon: BookOpen,
		content: () => (
			<div className="space-y-8 py-4">
				<section>
					<h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
						<BookOpen className="h-6 w-6 text-primary" />
						Project Overview
					</h2>
					<div className="prose max-w-none bg-card rounded-lg p-6 border shadow-sm">
						<p>
							The TEA Techniques Database is an interactive repository designed to work in conjunction with the
							<a href="https://assuranceplatform.azurewebsites.net/" className="text-primary hover:underline"> Trustworthy and Ethical Assurance (TEA) platform</a> as
							a core plugin to enable practitioners to identify and implement appropriate assurance methods.
						</p>
						<br />
						<p>
							This database provides a structured way to explore and understand various techniques for evidencing
							claims about responsible AI design, development, and deployment. By organizing techniques by assurance
							goals, categories, and subcategories, it helps practitioners find exactly what they need for their
							specific use cases.
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
									<strong>Structured Documentation</strong>: Each technique includes comprehensive information about its purpose, implementation details, and practical use cases.
								</div>
							</li>
							<li className="flex items-start gap-2">
								<div className="h-5 w-5 text-primary flex-shrink-0 mt-0.5">→</div>
								<div>
									<strong>Categorized Organization</strong>: Techniques are organized by assurance goals, categories, and subcategories to help you find exactly what you need.
								</div>
							</li>
							<li className="flex items-start gap-2">
								<div className="h-5 w-5 text-primary flex-shrink-0 mt-0.5">→</div>
								<div>
									<strong>API Access</strong>: Access all data through a comprehensive REST API with documentation via Swagger.
								</div>
							</li>
							<li className="flex items-start gap-2">
								<div className="h-5 w-5 text-primary flex-shrink-0 mt-0.5">→</div>
								<div>
									<strong>Model Agnostic & Specific</strong>: Browse techniques that work across different model types or that are designed for specific model architectures.
								</div>
							</li>
						</ul>
					</div>
				</section>
			</div>
		)
	},
	{
		id: "developer-instructions",
		label: "Developer Instructions",
		icon: Code,
		content: () => (
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
								This project uses Poetry for Python dependency management. If you don't have Poetry installed, follow the installation instructions.
							</p>
						</div>

						<div className="space-y-2">
							<h3 className="text-lg font-semibold flex items-center gap-2">
								<div className="h-5 w-5 text-primary">📁</div>
								SQLite Setup (Quick Start for Development)
							</h3>
							<ol className="mt-4 space-y-4">
								<li className="flex gap-3">
									<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold flex-shrink-0 mt-0.5">1</span>
									<div>
										<strong className="text-primary">Clone the repository</strong>
										<p className="text-sm text-muted-foreground mt-1">
											git clone https://github.com/chrisdburr/tea-techniques.git
										</p>
									</div>
								</li>
								<li className="flex gap-3">
									<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold flex-shrink-0 mt-0.5">2</span>
									<div>
										<strong className="text-primary">Setup environment variables</strong>
										<p className="text-sm text-muted-foreground mt-1">
											Copy .env.example to .env and adjust values as needed
										</p>
									</div>
								</li>
								<li className="flex gap-3">
									<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold flex-shrink-0 mt-0.5">3</span>
									<div>
										<strong className="text-primary">Set up the backend</strong>
										<p className="text-sm text-muted-foreground mt-1">
											cd backend && poetry install && USE_SQLITE=True python manage.py reset_and_import_techniques
										</p>
									</div>
								</li>
								<li className="flex gap-3">
									<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold flex-shrink-0 mt-0.5">4</span>
									<div>
										<strong className="text-primary">Run the backend</strong>
										<p className="text-sm text-muted-foreground mt-1">
											USE_SQLITE=True poetry run python manage.py runserver
										</p>
									</div>
								</li>
								<li className="flex gap-3">
									<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold flex-shrink-0 mt-0.5">5</span>
									<div>
										<strong className="text-primary">Set up and run the frontend</strong>
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
								<p className="text-muted-foreground mb-2">Django with Django REST Framework</p>
								<ul className="space-y-2 text-sm">
									<li><code className="bg-muted px-2 py-1 rounded text-primary font-mono">backend/api</code> - Main Django app</li>
									<li><code className="bg-muted px-2 py-1 rounded text-primary font-mono">backend/config</code> - Django project settings</li>
									<li><code className="bg-muted px-2 py-1 rounded text-primary font-mono">backend/data</code> - JSON file and schema for techniques</li>
								</ul>
							</div>
							<div className="space-y-4">
								<h3 className="text-lg font-semibold">Frontend</h3>
								<p className="text-muted-foreground mb-2">Next.js with TypeScript and Tailwind CSS</p>
								<ul className="space-y-2 text-sm">
									<li><code className="bg-muted px-2 py-1 rounded text-primary font-mono">frontend/src/app</code> - Next.js pages and routes</li>
									<li><code className="bg-muted px-2 py-1 rounded text-primary font-mono">frontend/src/components</code> - Reusable React components</li>
									<li><code className="bg-muted px-2 py-1 rounded text-primary font-mono">frontend/src/lib</code> - Utilities, types, and API clients</li>
								</ul>
							</div>
						</div>
					</div>
				</section>
			</div>
		)
	},
	{
		id: "community-contributions",
		label: "Community Contributions",
		icon: Users,
		content: () => (
			<div className="space-y-8 py-4">
				<section>
					<h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
						<Users className="h-6 w-6 text-primary" />
						How to Contribute
					</h2>
					<div className="bg-card rounded-lg border shadow-sm p-6">
						<p className="mb-4">
							Contributions to the TEA Techniques Database are welcome! Here's how you can contribute:
						</p>
						<ol className="space-y-4">
							<li className="flex gap-3 items-start">
								<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold mt-0.5">1</span>
								<div>
									<strong className="text-primary">Fork the repository on GitHub</strong>
								</div>
							</li>
							<li className="flex gap-3 items-start">
								<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold mt-0.5">2</span>
								<div>
									<strong className="text-primary">Create your feature branch</strong>
									<p className="text-sm text-muted-foreground mt-1">
										git checkout -b feature/amazing-feature
									</p>
								</div>
							</li>
							<li className="flex gap-3 items-start">
								<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold mt-0.5">3</span>
								<div>
									<strong className="text-primary">Commit your changes</strong>
									<p className="text-sm text-muted-foreground mt-1">
										git commit -m 'Add some amazing feature'
									</p>
								</div>
							</li>
							<li className="flex gap-3 items-start">
								<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold mt-0.5">4</span>
								<div>
									<strong className="text-primary">Push to the branch</strong>
									<p className="text-sm text-muted-foreground mt-1">
										git push origin feature/amazing-feature
									</p>
								</div>
							</li>
							<li className="flex gap-3 items-start">
								<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold mt-0.5">5</span>
								<div>
									<strong className="text-primary">Open a Pull Request</strong>
									<p className="text-sm text-muted-foreground mt-2">
										Please ensure your code follows the project's coding standards and includes appropriate tests.
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
									<strong>Through the UI</strong>: Once logged in with appropriate permissions, you can use the "Add New Technique" form.
								</div>
							</li>
							<li className="flex items-start gap-2">
								<div className="h-5 w-5 text-primary flex-shrink-0 mt-0.5">→</div>
								<div>
									<strong>Via JSON modifications</strong>: The backend includes a directory where the dataset is stored as a single JSON file, which can be re-imported.
								</div>
							</li>
							<li className="flex items-start gap-2">
								<div className="h-5 w-5 text-primary flex-shrink-0 mt-0.5">→</div>
								<div>
									<strong>API Endpoints</strong>: You can programmatically add techniques using the REST API.
								</div>
							</li>
						</ul>
						<p className="mt-4">
							When adding a new technique, please ensure you provide comprehensive information, including:
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
							To maintain the quality and usefulness of the TEA Techniques Database, please follow these guidelines:
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
							We aim to create a welcoming and productive community that advances the field of responsible AI development.
						</p>
					</div>
				</section>
			</div>
		)
	},
	{
		id: "technique-evaluation",
		label: "Technique Evaluation",
		icon: FileText,
		content: TechniqueEvaluationContent
	},
	{
		id: "tag-definitions",
		label: "Tag Definitions",
		icon: Hash,
		content: TagDefinitionsContent
	}
];

// Helper function to get tab by ID
export const getTabById = (id: string): TabConfig | undefined => {
	return aboutTabs.find(tab => tab.id === id);
};