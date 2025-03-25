// src/app/about/page.tsx
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrismCodeBlock as CodeBlock } from "@/components/ui/prism-code-block";
import { ArrowRight, BookOpen, Code, Layers, Users, Zap } from "lucide-react";

export default function AboutPage() {
	return (
		<MainLayout>
			<div className="space-y-8 max-w-4xl mx-auto">
				<div>
					<h1 className="text-3xl font-bold mb-4">
						About TEA Techniques
					</h1>
					<p className="text-muted-foreground text-lg">
						A platform for exploring techniques for evidencing
						claims about responsible design, development, and
						deployment of data-driven technologies.
					</p>
				</div>

				<Tabs defaultValue="project-info" className="w-full">
					<TabsList className="mb-6">
						<TabsTrigger value="project-info" className="flex items-center gap-2">
							<BookOpen className="h-4 w-4" />
							Project Information
						</TabsTrigger>
						<TabsTrigger value="developer-instructions" className="flex items-center gap-2">
							<Code className="h-4 w-4" />
							Developer Instructions
						</TabsTrigger>
						<TabsTrigger value="community-contributions" className="flex items-center gap-2">
							<Users className="h-4 w-4" />
							Community Contributions
						</TabsTrigger>
					</TabsList>

					<TabsContent
						value="project-info"
						className="space-y-8 py-4"
					>
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
								<Zap className="h-6 w-6 text-primary" />
								Key Features
							</h2>
							<div className="prose max-w-none bg-card rounded-lg p-6 border shadow-sm">
								<ul className="space-y-3">
									<li className="flex items-start gap-2">
										<ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
										<div>
											<strong>Structured Documentation</strong>: Each technique includes comprehensive information about its purpose, implementation details, and practical use cases.
										</div>
									</li>
									<li className="flex items-start gap-2">
										<ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
										<div>
											<strong>Categorized Organization</strong>: Techniques are organized by assurance goals, categories, and subcategories to help you find exactly what you need.
										</div>
									</li>
									<li className="flex items-start gap-2">
										<ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
										<div>
											<strong>API Access</strong>: Access all data through a comprehensive REST API with documentation via Swagger.
										</div>
									</li>
									<li className="flex items-start gap-2">
										<ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
										<div>
											<strong>Model Agnostic & Specific</strong>: Browse techniques that work across different model types or that are designed for specific model architectures.
										</div>
									</li>
								</ul>
							</div>
						</section>
					</TabsContent>

					<TabsContent
						value="developer-instructions"
						className="space-y-8 py-4"
					>
						<section>
							<h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
								<Code className="h-6 w-6 text-primary" />
								Development Setup
							</h2>
							<div className="bg-card rounded-lg border shadow-sm p-6 space-y-6">
								<div className="space-y-2">
									<h3 className="text-lg font-semibold flex items-center gap-2">
										<Zap className="h-5 w-5 text-primary" />
										Prerequisites
									</h3>
									<p className="text-muted-foreground mb-2">
										This project uses Poetry for Python dependency management. If you don&apos;t have Poetry installed:
									</p>
									<CodeBlock
										language="bash"
										code={`# On Linux, macOS, Windows (WSL)
curl -sSL https://install.python-poetry.org | python3 -

# On Windows (PowerShell)
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -`}
									/>
								</div>

								<div className="space-y-2">
									<h3 className="text-lg font-semibold flex items-center gap-2">
										<Layers className="h-5 w-5 text-primary" />
										SQLite Setup (Quick Start for Development)
									</h3>
									<ol className="mt-4">
										<li className="rounded-lg p-4">
											<div className="flex items-center gap-3 mb-2">
												<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold">1</span>
												<strong className="text-primary">Clone the repository</strong>
											</div>
											<CodeBlock
												language="bash"
												code={`git clone https://github.com/chrisdburr/tea-techniques.git
cd tea-techniques`}
											/>
										</li>
										<li className="rounded-lg p-4">
											<div className="flex items-center gap-3 mb-2">
												<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold">2</span>
												<strong className="text-primary">Setup environment variable</strong>
											</div>
											<CodeBlock
												language="bash"
												code={`cp .env.example .env`}
											/>
											<p className="text-sm text-muted-foreground mt-2">You may want to review and adjust the values in the <code>.env</code> file (e.g. change user and password)</p>
										</li>
										<li className="rounded-lg p-4">
											<div className="flex items-center gap-3 mb-2">
												<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold">3</span>
												<strong className="text-primary">Set up the backend</strong>
											</div>
											<CodeBlock
												language="bash"
												code={`cd backend
poetry install
USE_SQLITE=True python manage.py reset_and_import_techniques`}
											/>
										</li>
										<li className="rounded-lg p-4">
											<div className="flex items-center gap-3 mb-2">
												<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold">4</span>
												<strong className="text-primary">Run the backend with SQLite</strong>
											</div>
											<CodeBlock
												language="bash"
												code={`USE_SQLITE=True poetry run python manage.py runserver`}
											/>
										</li>
										<li className="rounded-lg p-4">
											<div className="flex items-center gap-3 mb-2">
												<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold">5</span>
												<strong className="text-primary">In a new terminal, set up and run the frontend</strong>
											</div>
											<CodeBlock
												language="bash"
												code={`cd frontend
npm install
npm run dev --turbopack`}
											/>
										</li>
										<li className="rounded-lg p-4">
											<div className="flex items-center gap-3 mb-2">
												<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold">6</span>
												<strong className="text-primary">Access the application</strong>
											</div>
											<ul className="mt-2 space-y-1">
												<li className="flex items-center gap-2">
													<ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
													<span className="bg-muted px-2 py-1 rounded text-primary font-mono">Frontend:</span>
													<code className="text-primary">http://localhost:3000</code>
												</li>
												<li className="flex items-center gap-2">
													<ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
													<span className="bg-muted px-2 py-1 rounded text-primary font-mono">API:</span>
													<code className="text-primary">http://localhost:8000/api/</code>
												</li>
												<li className="flex items-center gap-2">
													<ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
													<span className="bg-muted px-2 py-1 rounded text-primary font-mono">Admin:</span>
													<code className="text-primary">http://localhost:8000/admin/</code>
												</li>
											</ul>
										</li>
									</ol>
								</div>
							</div>
						</section>

						<section>
							<h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
								<Layers className="h-6 w-6 text-primary" />
								Project Structure
							</h2>
							<div className="bg-card rounded-lg border shadow-sm p-6 space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-4">
										<h3 className="text-lg font-semibold flex items-center gap-2">
											<ArrowRight className="h-5 w-5 text-primary" />
											Backend
										</h3>
										<p className="text-muted-foreground mb-2">Django with Django REST Framework</p>
										<ul className="space-y-2 text-sm">
											<li className="flex items-start gap-2">
												<code className="bg-muted px-2 py-1 rounded text-primary font-mono min-w-32">backend/api</code>
												<span>Main Django app</span>
											</li>
											<li className="flex items-start gap-2">
												<code className="bg-muted px-2 py-1 rounded text-primary font-mono min-w-32">backend/config</code>
												<span>Django project settings</span>
											</li>
											<li className="flex items-start gap-2">
												<code className="bg-muted px-2 py-1 rounded text-primary font-mono min-w-32">backend/data</code>
												<span>JSON file and schema for techniques</span>
											</li>
										</ul>
									</div>
									<div className="space-y-4">
										<h3 className="text-lg font-semibold flex items-center gap-2">
											<ArrowRight className="h-5 w-5 text-primary" />
											Frontend
										</h3>
										<p className="text-muted-foreground mb-2">Next.js with TypeScript and Tailwind CSS</p>
										<ul className="space-y-2 text-sm">
											<li className="flex items-start gap-2">
												<code className="bg-muted px-2 py-1 rounded text-primary font-mono min-w-32">frontend/src/app</code>
												<span>Next.js pages and routes</span>
											</li>
											<li className="flex items-start gap-2">
												<code className="bg-muted px-2 py-1 rounded text-primary font-mono min-w-32">frontend/src/components</code>
												<span>Reusable React components</span>
											</li>
											<li className="flex items-start gap-2">
												<code className="bg-muted px-2 py-1 rounded text-primary font-mono min-w-32">frontend/src/lib</code>
												<span>Utilities, types, and API clients</span>
											</li>
										</ul>
									</div>
								</div>
							</div>
						</section>

						<section>
							<h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
								<Zap className="h-6 w-6 text-primary" />
								Testing
							</h2>
							<div className="bg-card rounded-lg border shadow-sm p-6 space-y-6">
								<p className="mb-4">
									The project includes a comprehensive testing setup for both the frontend and backend.
								</p>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-4">
										<h3 className="text-lg font-semibold flex items-center gap-2">
											<ArrowRight className="h-5 w-5 text-primary" />
											Frontend Testing
										</h3>
										<p className="text-muted-foreground mb-2">
											The frontend uses Jest and React Testing Library for component testing. To run tests:
										</p>
										<CodeBlock
											language="bash"
											code={`cd frontend
npm test`}
										/>
									</div>

									<div className="space-y-4">
										<h3 className="text-lg font-semibold flex items-center gap-2">
											<ArrowRight className="h-5 w-5 text-primary" />
											Backend Testing
										</h3>
										<p className="text-muted-foreground mb-2">
											The backend uses Django&apos;s testing framework. To run tests:
										</p>
										<CodeBlock
											language="bash"
											code={`cd backend
python manage.py test`}
										/>
									</div>
								</div>
							</div>
						</section>
					</TabsContent>

					<TabsContent
						value="community-contributions"
						className="space-y-8 py-4"
					>
						<section>
							<h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
								<Users className="h-6 w-6 text-primary" />
								How to Contribute
							</h2>
							<div className="bg-card rounded-lg border shadow-sm p-6">
								<p className="mb-4">
									Contributions to the TEA Techniques Database are welcome! Here&apos;s how you can contribute:
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
										<div className="flex-1">
											<strong className="text-primary">Create your feature branch</strong>
											<CodeBlock
												language="bash"
												code={`git checkout -b feature/amazing-feature`}
												className="mt-2"
											/>
										</div>
									</li>
									<li className="flex gap-3 items-start">
										<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold mt-0.5">3</span>
										<div className="flex-1">
											<strong className="text-primary">Commit your changes</strong>
											<CodeBlock
												language="bash"
												code={`git commit -m 'Add some amazing feature'`}
												className="mt-2"
											/>
										</div>
									</li>
									<li className="flex gap-3 items-start">
										<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold mt-0.5">4</span>
										<div className="flex-1">
											<strong className="text-primary">Push to the branch</strong>
											<CodeBlock
												language="bash"
												code={`git push origin feature/amazing-feature`}
												className="mt-2"
											/>
										</div>
									</li>
									<li className="flex gap-3 items-start">
										<span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 text-sm font-bold mt-0.5">5</span>
										<div>
											<strong className="text-primary">Open a Pull Request</strong>
											<p className="text-sm text-muted-foreground mt-2">
												Please ensure your code follows the project&apos;s coding standards and includes appropriate tests.
											</p>
										</div>
									</li>
								</ol>
							</div>
						</section>

						<section>
							<h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
								<Zap className="h-6 w-6 text-primary" />
								Adding New Techniques
							</h2>
							<div className="bg-card rounded-lg border shadow-sm p-6">
								<p className="mb-4">
									The database of techniques can be expanded in several ways:
								</p>
								<ul className="space-y-4">
									<li className="flex items-start gap-2">
										<ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
										<div>
											<strong>Through the UI</strong>: Once logged in with appropriate permissions, you can use the &ldquo;Add New Technique&quot; form.
										</div>
									</li>
									<li className="flex items-start gap-2">
										<ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
										<div>
											<strong>Via JSON modifications</strong>: The backend includes a directory where the dataset is stored as a single JSON file, which can be re-imported.
										</div>
									</li>
									<li className="flex items-start gap-2">
										<ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
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
										<ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
										<span>Provide accurate and verifiable information</span>
									</li>
									<li className="flex items-start gap-2">
										<ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
										<span>Be respectful and constructive in discussions</span>
									</li>
									<li className="flex items-start gap-2">
										<ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
										<span>Follow the code of conduct</span>
									</li>
									<li className="flex items-start gap-2">
										<ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
										<span>Respect intellectual property rights</span>
									</li>
									<li className="flex items-start gap-2">
										<ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
										<span>Use inclusive language</span>
									</li>
								</ul>
								<p className="mt-4">
									We aim to create a welcoming and productive community that advances the field of responsible AI development.
								</p>
							</div>
						</section>
					</TabsContent>
				</Tabs>

				<div className="flex justify-center py-6">
					<Button asChild size="lg" className="gap-2">
						<Link href="/techniques">
							Explore Techniques
							<ArrowRight className="h-4 w-4" />
						</Link>
					</Button>
				</div>
			</div>
		</MainLayout>
	);
}