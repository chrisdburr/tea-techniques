"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";

export default function Home() {
	return (
		<MainLayout>
			<div className="space-y-6">
				<section className="py-12">
					<div className="text-center space-y-4">
						<h1 className="text-4xl font-bold">
							Explainability Techniques Database
						</h1>
						<p className="text-muted-foreground max-w-xl mx-auto">
							A comprehensive database of Explainability AI
							techniques for Trustworthy and Ethical Assurance
							(TEA).
						</p>
						<div className="flex justify-center gap-4 mt-6">
							<Button asChild size="lg">
								<Link href="/techniques">
									Browse Techniques
								</Link>
							</Button>
							<Button asChild variant="outline" size="lg">
								<Link href="/about">Learn More</Link>
							</Button>
						</div>
					</div>
				</section>

				<section className="py-12 bg-muted/50 rounded-lg">
					<div className="container mx-auto px-4">
						<h2 className="text-2xl font-bold text-center mb-8">
							Explore by Assurance Goal
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Card>
								<CardHeader>
									<CardTitle>Explainability</CardTitle>
									<CardDescription>
										Ensuring model decisions are transparent
										and understandable.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<p className="mb-4">
										Explore techniques for making AI models
										more interpretable and their decisions
										explainable to humans.
									</p>
									<Button asChild variant="outline">
										<Link href="/techniques?assurance_goal=1">
											View Explainability Techniques
										</Link>
									</Button>
								</CardContent>
							</Card>
							<Card>
								<CardHeader>
									<CardTitle>Fairness</CardTitle>
									<CardDescription>
										Promoting equitable outcomes across
										different user groups.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<p className="mb-4">
										Discover methods to detect and mitigate
										biases in AI systems for more equitable
										decision-making.
									</p>
									<Button asChild variant="outline">
										<Link href="/techniques?assurance_goal=2">
											View Fairness Techniques
										</Link>
									</Button>
								</CardContent>
							</Card>
						</div>
					</div>
				</section>

				<section className="py-12">
					<div className="container mx-auto px-4">
						<h2 className="text-2xl font-bold text-center mb-8">
							Browse by Category
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
							{[
								{
									title: "Feature Analysis",
									description:
										"Techniques that analyze input features' contributions.",
									link: "/techniques?category=1",
								},
								{
									title: "Model Approximation",
									description:
										"Methods that create interpretable surrogates of complex models.",
									link: "/techniques?category=2",
								},
								{
									title: "Visualization Techniques",
									description:
										"Methods that create visual representations of model behavior.",
									link: "/techniques?category=3",
								},
								{
									title: "Example-Based Methods",
									description:
										"Techniques using specific instances to explain predictions.",
									link: "/techniques?category=4",
								},
								{
									title: "Rule Extraction",
									description:
										"Methods deriving human-readable rules from models.",
									link: "/techniques?category=5",
								},
								{
									title: "Uncertainty and Reliability",
									description:
										"Techniques assessing confidence and reliability of predictions.",
									link: "/techniques?category=6",
								},
							].map((category, index) => (
								<Card key={index}>
									<CardHeader>
										<CardTitle className="text-lg">
											{category.title}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground mb-4">
											{category.description}
										</p>
										<Button
											asChild
											variant="ghost"
											size="sm"
										>
											<Link href={category.link}>
												Browse
											</Link>
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</section>
			</div>
		</MainLayout>
	);
}
