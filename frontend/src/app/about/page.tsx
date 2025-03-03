"use client";

import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
					</TabsList>

					<TabsContent
						value="project-info"
						className="space-y-6 py-4"
					>
						<section>
							<h2 className="text-2xl font-semibold mb-3">
								Project Overview
							</h2>
							<Card>
								<CardContent className="pt-6 space-y-4">
									<p>
										The TEA Techniques platform is designed
										to be used in conjunction with the
										Trustworthy and Ethical Assurance (TEA)
										platform. It provides a searchable
										database of techniques for evidencing
										claims about responsible design,
										development, and deployment of
										data-driven technologies.
									</p>
									<p>
										This platform organizes techniques by
										assurance goals:
									</p>
									<ul className="list-disc pl-6 space-y-2">
										<li>
											<strong>Explainability</strong> -
											Ensuring model decisions are
											transparent and understandable.
										</li>
										<li>
											<strong>Fairness</strong> -
											Promoting equitable outcomes across
											different user groups.
										</li>
									</ul>
								</CardContent>
							</Card>
						</section>

						<section>
							<h2 className="text-2xl font-semibold mb-3">
								Key Features
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Card>
									<CardHeader>
										<CardTitle>
											Structured Documentation
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p>
											Each technique includes
											comprehensive information about its
											purpose, implementation details, and
											practical use cases.
										</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>
											Categorized Organization
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p>
											Techniques are organized by
											assurance goals, categories, and
											subcategories to help you find
											exactly what you need.
										</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>API Access</CardTitle>
									</CardHeader>
									<CardContent>
										<p>
											Access all data through a
											comprehensive REST API with
											documentation via Swagger.
										</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>
											Model Agnostic & Specific
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p>
											Browse techniques that work across
											different model types or that are
											designed for specific model
											architectures.
										</p>
									</CardContent>
								</Card>
							</div>
						</section>
					</TabsContent>

					<TabsContent
						value="developer-instructions"
						className="space-y-6 py-4"
					>
						<h2 className="text-2xl font-semibold mb-3">
							Development Setup
						</h2>

						<Card>
							<CardHeader>
								<CardTitle>Quick Start (Recommended)</CardTitle>
								<CardDescription>
									Local development using SQLite
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<ol className="list-decimal pl-6 space-y-2">
									<li>
										<strong>Clone the repository</strong>
										<pre className="bg-muted p-2 rounded-md mt-1 overflow-x-auto">
											<code>
												git clone
												https://github.com/your-repo/tea-techniques.git
												<br />
												cd tea-techniques
											</code>
										</pre>
									</li>
									<li>
										<strong>Set up the backend</strong>
										<pre className="bg-muted p-2 rounded-md mt-1 overflow-x-auto">
											<code>
												cd backend
												<br />
												poetry install
												<br />
												poetry run python
												scripts/setup_dev.py
											</code>
										</pre>
									</li>
									<li>
										<strong>
											Run the backend with SQLite
										</strong>
										<pre className="bg-muted p-2 rounded-md mt-1 overflow-x-auto">
											<code>
												USE_SQLITE=True poetry run
												python manage.py runserver
											</code>
										</pre>
									</li>
									<li>
										<strong>
											Set up and run the frontend
										</strong>
										<pre className="bg-muted p-2 rounded-md mt-1 overflow-x-auto">
											<code>
												cd frontend
												<br />
												npm install
												<br />
												npm run dev --turbopack
											</code>
										</pre>
									</li>
								</ol>
								<p>Access the application at:</p>
								<ul className="list-disc pl-6 space-y-1">
									<li>
										Frontend:{" "}
										<code>http://localhost:3000</code>
									</li>
									<li>
										API:{" "}
										<code>http://localhost:8000/api/</code>
									</li>
									<li>
										Admin:{" "}
										<code>
											http://localhost:8000/admin/
										</code>{" "}
										(username: admin, password: admin)
									</li>
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>
									Using Docker (for production-like
									environment)
								</CardTitle>
								<CardDescription>
									Full setup with PostgreSQL database
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<ol className="list-decimal pl-6 space-y-2">
									<li>
										<strong>
											Setup environment variables
										</strong>
										<pre className="bg-muted p-2 rounded-md mt-1 overflow-x-auto">
											<code>mv .env.example .env</code>
										</pre>
										<p className="text-sm text-muted-foreground mt-1">
											Review and adjust the values (e.g.,
											change user and password)
										</p>
									</li>
									<li>
										<strong>Start the database</strong>
										<pre className="bg-muted p-2 rounded-md mt-1 overflow-x-auto">
											<code>docker compose up -d</code>
										</pre>
									</li>
								</ol>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Project Structure</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<h3 className="font-medium mb-2">
										Backend: Django with Django REST
										Framework
									</h3>
									<ul className="list-disc pl-6 space-y-1">
										<li>
											<code>backend/api</code>: Main
											Django app
										</li>
										<li>
											<code>backend/config</code>: Django
											project settings
										</li>
										<li>
											<code>backend/scripts</code>:
											Utility scripts
										</li>
									</ul>
								</div>

								<div>
									<h3 className="font-medium mb-2">
										Frontend: Next.js with TypeScript and
										Tailwind CSS
									</h3>
									<ul className="list-disc pl-6 space-y-1">
										<li>
											<code>frontend/src/app</code>:
											Next.js pages and routes
										</li>
										<li>
											<code>frontend/src/components</code>
											: Reusable React components
										</li>
										<li>
											<code>frontend/src/lib</code>:
											Utilities, types, and API clients
										</li>
									</ul>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Testing</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<h3 className="font-medium mb-2">
										Frontend Testing
									</h3>
									<p>
										The frontend uses Jest and React Testing
										Library for component and API testing.
									</p>
									<pre className="bg-muted p-2 rounded-md mt-1 overflow-x-auto">
										<code>
											cd frontend
											<br />
											npm run test
										</code>
									</pre>
									<p className="mt-2">
										For watch mode during development:
									</p>
									<pre className="bg-muted p-2 rounded-md mt-1 overflow-x-auto">
										<code>
											cd frontend
											<br />
											npm run test:watch
										</code>
									</pre>
								</div>

								<div>
									<h3 className="font-medium mb-2">
										Backend Testing
									</h3>
									<p>
										The backend uses pytest and Django&apos;s
										testing tools for model and API testing.
									</p>
									<pre className="bg-muted p-2 rounded-md mt-1 overflow-x-auto">
										<code>
											cd backend
											<br />
											USE_SQLITE=True poetry run pytest
										</code>
									</pre>
									<p className="mt-2">
										For test coverage reports:
									</p>
									<pre className="bg-muted p-2 rounded-md mt-1 overflow-x-auto">
										<code>
											cd backend
											<br />
											poetry run pytest --cov=api
										</code>
									</pre>
								</div>

								<div>
									<h3 className="font-medium mb-2">
										Integration Testing
									</h3>
									<p>
										A custom integration testing script is
										provided to test the interaction between
										frontend and backend by making direct
										API calls.
									</p>
									<pre className="bg-muted p-2 rounded-md mt-1 overflow-x-auto">
										<code>
											# Install dependencies if needed
											<br />
											pip install requests rich
											<br />
											<br />
											# Run integration tests
											<br />
											python scripts/test_integration.py
										</code>
									</pre>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Database Migrations</CardTitle>
							</CardHeader>
							<CardContent>
								<p>
									When changing models, create and apply
									migrations:
								</p>
								<pre className="bg-muted p-2 rounded-md mt-1 overflow-x-auto">
									<code>
										cd backend
										<br />
										USE_SQLITE=True poetry run python
										manage.py makemigrations
										<br />
										USE_SQLITE=True poetry run python
										manage.py migrate
									</code>
								</pre>
							</CardContent>
						</Card>
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
