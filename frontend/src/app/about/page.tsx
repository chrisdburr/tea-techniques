// src/app/about/page.tsx
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
					<TabsList>
						<TabsTrigger value="project-info">
							Project Information
						</TabsTrigger>
						<TabsTrigger value="developer-instructions">
							Developer Instructions
						</TabsTrigger>
						<TabsTrigger value="community-contributions">
							Community Contributions
						</TabsTrigger>
					</TabsList>

					<TabsContent
						value="project-info"
						className="space-y-8 py-4"
					>
						<section>
							<h2 className="text-2xl font-bold mb-4">
								Project Overview
							</h2>
							<div className="prose max-w-none">
								<p>
									The TEA Techniques Database is an interactive repository designed to work in conjunction with the
									<a href="https://assuranceplatform.azurewebsites.net/" className="text-primary hover:underline"> Trustworthy and Ethical Assurance (TEA) platform</a> as
									a core plugin to enable practitioners to identify and implement appropriate assurance methods.
								</p>
								<p>
									This database provides a structured way to explore and understand various techniques for evidencing
									claims about responsible AI design, development, and deployment. By organizing techniques by assurance
									goals, categories, and subcategories, it helps practitioners find exactly what they need for their
									specific use cases.
								</p>
							</div>
						</section>

						<section>
							<h2 className="text-2xl font-bold mb-4">
								Key Features
							</h2>
							<div className="prose max-w-none">
								<ul>
									<li>
										<strong>Structured Documentation</strong>: Each technique includes comprehensive information about its purpose, implementation details, and practical use cases.
									</li>
									<li>
										<strong>Categorized Organization</strong>: Techniques are organized by assurance goals, categories, and subcategories to help you find exactly what you need.
									</li>
									<li>
										<strong>API Access</strong>: Access all data through a comprehensive REST API with documentation via Swagger.
									</li>
									<li>
										<strong>Model Agnostic & Specific</strong>: Browse techniques that work across different model types or that are designed for specific model architectures.
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
							<h2 className="text-2xl font-bold mb-4">
								Development Setup
							</h2>
							<div className="prose max-w-none">
								<h3>Prerequisites</h3>
								<p>
									This project uses Poetry for Python dependency management. If you don&apos;t have Poetry installed:
								</p>
								<pre><code>{`# On Linux, macOS, Windows (WSL)
curl -sSL https://install.python-poetry.org | python3 -

# On Windows (PowerShell)
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -`}</code></pre>

								<h3>SQLite Setup (Quick Start for Development)</h3>
								<ol>
									<li>
										<strong>Clone the repository</strong>
										<pre><code>{`git clone https://github.com/chrisdburr/tea-techniques.git
cd tea-techniques`}</code></pre>
									</li>
									<li>
										<strong>Setup environment variable</strong>
										<pre><code>{`cp .env.example .env`}</code></pre>
										<p>You may want to review and adjust the values in the <code>.env</code> file (e.g. change user and password)</p>
									</li>
									<li>
										<strong>Set up the backend</strong>
										<pre><code>{`cd backend
poetry install
USE_SQLITE=True python manage.py reset_and_import_techniques`}</code></pre>
									</li>
									<li>
										<strong>Run the backend with SQLite</strong>
										<pre><code>{`USE_SQLITE=True poetry run python manage.py runserver`}</code></pre>
									</li>
									<li>
										<strong>In a new terminal, set up and run the frontend</strong>
										<pre><code>{`cd frontend
npm install
npm run dev --turbopack`}</code></pre>
									</li>
									<li>
										<strong>Access the application</strong>
										<ul>
											<li>Frontend: http://localhost:3000</li>
											<li>API: http://localhost:8000/api/</li>
											<li>Django Admin: http://localhost:8000/admin/</li>
										</ul>
									</li>
								</ol>
							</div>
						</section>

						<section>
							<h2 className="text-2xl font-bold mb-4">
								Project Structure
							</h2>
							<div className="prose max-w-none">
								<ul>
									<li>
										<strong>Backend</strong>: Django with Django REST Framework
										<ul>
											<li><code>backend/api</code>: Main Django app</li>
											<li><code>backend/config</code>: Django project settings</li>
											<li><code>backend/scripts</code>: Utility scripts (e.g. reset DB, import CSV)</li>
											<li><code>backend/data</code>: CSV file with technique data</li>
										</ul>
									</li>
									<li>
										<strong>Frontend</strong>: Next.js with TypeScript and Tailwind CSS
										<ul>
											<li><code>frontend/src/app</code>: Next.js pages and routes</li>
											<li><code>frontend/src/components</code>: Reusable React components</li>
											<li><code>frontend/src/lib</code>: Utilities, types, and API clients</li>
										</ul>
									</li>
								</ul>
							</div>
						</section>

						<section>
							<h2 className="text-2xl font-bold mb-4">Testing</h2>
							<div className="prose max-w-none">
								<p>
									The project includes a comprehensive testing setup for both the frontend and backend.
								</p>
								<h3>Frontend Testing</h3>
								<p>
									The frontend uses Jest and React Testing Library for component testing. To run tests:
								</p>
								<pre><code>{`cd frontend
npm test`}</code></pre>

								<h3>Backend Testing</h3>
								<p>
									The backend uses Django&apos;s testing framework. To run tests:
								</p>
								<pre><code>{`cd backend
python manage.py test`}</code></pre>
							</div>
						</section>
					</TabsContent>

					<TabsContent
						value="community-contributions"
						className="space-y-8 py-4"
					>
						<section>
							<h2 className="text-2xl font-bold mb-4">
								How to Contribute
							</h2>
							<div className="prose max-w-none">
								<p>
									Contributions to the TEA Techniques Database are welcome! Here&apos;s how you can contribute:
								</p>
								<ol>
									<li>Fork the repository on GitHub</li>
									<li>Create your feature branch (<code>git checkout -b feature/amazing-feature</code>)</li>
									<li>Commit your changes (<code>git commit -m &apos;Add some amazing feature&apos;</code>)</li>
									<li>Push to the branch (<code>git push origin feature/amazing-feature</code>)</li>
									<li>Open a Pull Request</li>
								</ol>
								<p>
									Please ensure your code follows the project&apos;s coding standards and includes appropriate tests.
								</p>
							</div>
						</section>

						<section>
							<h2 className="text-2xl font-bold mb-4">
								Adding New Techniques
							</h2>
							<div className="prose max-w-none">
								<p>
									The database of techniques can be expanded in several ways:
								</p>
								<ul>
									<li>
										<strong>Through the UI</strong>: Once logged in with appropriate permissions, you can use the &ldquo;Add New Technique&quot; form.
									</li>
									<li>
										<strong>Via CSV Import</strong>: The backend includes scripts for importing techniques from a CSV file.
									</li>
									<li>
										<strong>API Endpoints</strong>: You can programmatically add techniques using the REST API.
									</li>
								</ul>
								<p>
									When adding a new technique, please ensure you provide comprehensive information, including:
								</p>
								<ul>
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
							<h2 className="text-2xl font-bold mb-4">
								Community Guidelines
							</h2>
							<div className="prose max-w-none">
								<p>
									To maintain the quality and usefulness of the TEA Techniques Database, please follow these guidelines:
								</p>
								<ul>
									<li>Provide accurate and verifiable information</li>
									<li>Be respectful and constructive in discussions</li>
									<li>Follow the code of conduct</li>
									<li>Respect intellectual property rights</li>
									<li>Use inclusive language</li>
								</ul>
								<p>
									We aim to create a welcoming and productive community that advances the field of responsible AI development.
								</p>
							</div>
						</section>
					</TabsContent>
				</Tabs>

				<div className="flex justify-center py-6">
					<Button asChild>
						<Link href="/techniques">Explore Techniques</Link>
					</Button>
				</div>
			</div>
		</MainLayout>
	);
}