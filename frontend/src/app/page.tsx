"use client";

import Image from "next/image";
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
import { Database, FileText, Globe } from "lucide-react";

export default function HomePage() {

	return (
		<MainLayout>
			<div className="space-y-16 py-8">
				{/* Hero Section with Responsive Image */}
				<section className="container mx-auto">
					<div className="flex flex-col md:flex-row gap-8 items-center">
						<div className="w-full md:w-1/2 space-y-6 text-center md:text-left">
							<h1 className="text-4xl md:text-5xl font-bold">
								TEA Techniques Database
							</h1>
							<p className="text-xl text-muted-foreground">
								A platform for exploring techniques for
								evidencing claims about responsible design,
								development, and deployment of data-driven
								technologies.
							</p>
							<div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
								<Button asChild size="lg">
									<Link href="/techniques">
										Explore Techniques
									</Link>
								</Button>
								<Button asChild variant="outline" size="lg">
									<Link href="https://assuranceplatform.azurewebsites.net/">
										Go to TEA Platform
									</Link>
								</Button>
							</div>
						</div>
						<div className="w-full md:w-1/2 mt-8 md:mt-0">
							<div className="relative aspect-[4/3] w-full max-w-lg mx-auto shadow-lg rounded-lg overflow-hidden">
								<Image
									src="/hero.jpg"
									alt="Assurance illustration showing various aspects of AI ethics and governance"
									fill
									style={{ objectFit: "cover" }}
									className="rounded-lg"
									priority
								/>
							</div>
						</div>
					</div>
				</section>

				{/* Features Section */}
				<section className="space-y-6">
					<div className="text-center mb-8">
						<h2 className="text-3xl font-bold">Key Features</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto mt-2">
							Tools and resources to help with ethical and
							responsible AI development
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<Card className="h-full">
							<CardHeader>
								<FileText className="h-12 w-12 text-primary mb-2" />
								<CardTitle>Structured Documentation</CardTitle>
								<CardDescription>
									Detailed descriptions and references for
									each technique
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Each technique includes comprehensive
									information about its purpose, limitations,
									and practical use cases.
								</p>
							</CardContent>
						</Card>

						<Card className="h-full">
							<CardHeader>
								<Database className="h-12 w-12 text-primary mb-2" />
								<CardTitle>Searchable Database</CardTitle>
								<CardDescription>
									Quickly find techniques that match your
									needs
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Filter by assurance goals, categories, and
									specific criteria to discover appropriate
									techniques for your project.
								</p>
							</CardContent>
						</Card>

						<Card className="h-full">
							<CardHeader>
								<Globe className="h-12 w-12 text-primary mb-2" />
								<CardTitle>Open Platform</CardTitle>
								<CardDescription>
									Access API documentation and contribute to
									the platform
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									TEA Techniques is designed to be an open,
									collaborative resource for the AI ethics
									community.
								</p>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Call to Action */}
				<section className="bg-muted/50 py-12 px-6 rounded-lg text-center space-y-6">
					<h2 className="text-3xl font-bold">
						Ready to get started?
					</h2>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						Explore our database of techniques to help ensure your
						AI systems are trustworthy and ethically developed.
					</p>
					<div className="pt-4">
						<Button asChild size="lg">
							<Link href="/techniques">Explore Techniques</Link>
						</Button>
					</div>
				</section>
			</div>
		</MainLayout>
	);
}
