// src/app/techniques/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useTechniqueDetail } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StarRating } from "@/components/ui/star-rating";
import Link from "next/link";
import {
	ArrowLeft,
	ArrowRight,
	Brain,
	CheckCircle,
	Cpu,
	Edit,
	Eye,
	ExternalLink,
	FileText,
	Book,
	FileCode,
	Package,
	GraduationCap,
	BookOpen,
	Info,
	Loader2,
	Lock,
	Scale,
	Shield,
	ShieldCheck,
} from "lucide-react";
import {
	TechniqueResource,
	TechniqueExampleUseCase,
	TechniqueLimitation,
	AttributeValue,
} from "@/lib/types";

// Utility function to find applicable models for model-specific techniques
// This simulates what we would expect from the backend API when updated
function findApplicableModels(techniqueId: number): string[] {
	// Sample data based on model-specific.json structure
	const modelSpecificData = {
		"Tree-based Models": {
			techniques: [
				{
					id: 3,
					name: "Mean Decrease Impurity",
					applicable_models: [
						"Decision Trees",
						"Random Forests",
						"Gradient Boosting Models",
					],
				},
				{
					id: 4,
					name: "Gini Importance",
					applicable_models: ["Decision Trees", "Random Forests"],
				},
				{
					id: 9,
					name: "Variable Importance in Random Forests (MDA MDG)",
					applicable_models: ["Random Forests"],
				},
			],
		},
		"Linear Models": {
			techniques: [
				{
					id: 5,
					name: "Coefficient Magnitudes (in Linear Models)",
					applicable_models: [
						"Linear Regression",
						"Logistic Regression",
						"Ridge Regression",
						"Lasso Regression",
					],
				},
			],
		},
		"Neural Networks": {
			techniques: [
				{
					id: 6,
					name: "Integrated Gradients",
					applicable_models: [
						"General Neural Networks",
						"CNNs",
						"RNNs",
						"Transformers",
					],
				},
				{
					id: 7,
					name: "DeepLIFT",
					applicable_models: [
						"General Neural Networks",
						"CNNs",
						"RNNs",
					],
				},
				{
					id: 8,
					name: "Layer-wise Relevance Propagation (LRP)",
					applicable_models: [
						"General Neural Networks",
						"CNNs",
						"RNNs",
					],
				},
			],
		},
	};

	// Search through all categories and techniques to find the matching ID
	for (const category of Object.values(modelSpecificData)) {
		for (const technique of category.techniques) {
			if (technique.id === techniqueId) {
				return technique.applicable_models || [];
			}
		}
	}

	return [];
}

// Helper component for section containers
function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="mb-8">
			<h2
				className="text-xl font-semibold mb-4"
				id={title.toLowerCase().replace(/\s+/g, "-")}
			>
				{title}
			</h2>
			<div className="bg-card rounded-lg border p-4 shadow-sm">
				{children}
			</div>
		</div>
	);
}

// Component to display technique resources
function TechniqueResources({ resources }: { resources: TechniqueResource[] }) {
	if (!resources || resources.length === 0) {
		return <p className="text-muted-foreground">No resources available.</p>;
	}

	// Function to get the appropriate icon for resource type
	const getResourceTypeIcon = (typeName: string) => {
		switch (typeName.toLowerCase()) {
			case "documentation":
				return <FileText className="h-5 w-5" aria-hidden="true" />;
			case "technical paper":
				return <FileCode className="h-5 w-5" aria-hidden="true" />;
			case "software package":
				return <Package className="h-5 w-5" aria-hidden="true" />;
			case "tutorial":
				return <GraduationCap className="h-5 w-5" aria-hidden="true" />;
			case "introductory paper":
				return <BookOpen className="h-5 w-5" aria-hidden="true" />;
			default:
				return <Book className="h-5 w-5" aria-hidden="true" />;
		}
	};

	// Group resources by type
	const resourcesByType = resources.reduce((acc, resource) => {
		const typeName = resource.resource_type_name;
		if (!acc[typeName]) {
			acc[typeName] = [];
		}
		acc[typeName].push(resource);
		return acc;
	}, {} as Record<string, TechniqueResource[]>);

	return (
		<div className="space-y-8">
			{Object.entries(resourcesByType).map(
				([typeName, typeResources]) => (
					<div key={typeName} className="space-y-4">
						<div className="flex items-center gap-2 text-primary font-medium">
							{getResourceTypeIcon(typeName)}
							<h3 className="font-medium">{typeName}</h3>
						</div>
						<div className="space-y-4 pl-7">
							{typeResources.map((resource) => (
								<div
									key={resource.id}
									className="border rounded-md p-4 hover:border-primary transition-colors"
								>
									<div className="flex items-center justify-between">
										<h4 className="font-medium">
											{resource.title}
										</h4>
										{/* Disabled button instead of link */}
										<Button
											variant="outline"
											size="sm"
											disabled={true}
											title="Links temporarily disabled pending review"
											className="flex items-center gap-1"
										>
											<ExternalLink
												className="h-4 w-4"
												aria-hidden="true"
											/>
											<span>View</span>
										</Button>
									</div>
									{resource.description && (
										<p className="text-sm mt-2 text-muted-foreground">
											{resource.description}
										</p>
									)}
								</div>
							))}
						</div>
					</div>
				)
			)}
		</div>
	);
}

function TechniqueExampleUseCases({
	useCases,
}: {
	useCases: TechniqueExampleUseCase[];
}) {
	if (!useCases || useCases.length === 0) {
		return (
			<p className="text-muted-foreground">
				No example use cases specified.
			</p>
		);
	}

	// Group use cases by assurance goal
	const groupedUseCases = useCases.reduce((acc, useCase) => {
		const goalName = useCase.assurance_goal_name || "Other";
		if (!acc[goalName]) {
			acc[goalName] = [];
		}
		acc[goalName].push(useCase);
		return acc;
	}, {} as Record<string, TechniqueExampleUseCase[]>);

	// Map assurance goals to their respective icons
	const goalIcons = {
		Explainability: <Brain className="h-5 w-5" aria-hidden="true" />,
		Fairness: <Scale className="h-5 w-5" aria-hidden="true" />,
		Security: <Shield className="h-5 w-5" aria-hidden="true" />,
		Safety: <ShieldCheck className="h-5 w-5" aria-hidden="true" />,
		Reliability: <CheckCircle className="h-5 w-5" aria-hidden="true" />,
		Transparency: <Eye className="h-5 w-5" aria-hidden="true" />,
		Privacy: <Lock className="h-5 w-5" aria-hidden="true" />,
		Other: <Info className="h-5 w-5" aria-hidden="true" />,
	};

	return (
		<div className="space-y-8">
			{Object.entries(groupedUseCases).map(([goalName, cases]) => (
				<div key={goalName} className="space-y-4">
					<div className="flex items-center gap-2 text-primary font-medium">
						{goalIcons[goalName as keyof typeof goalIcons] || (
							<Info className="h-5 w-5" aria-hidden="true" />
						)}
						<h3 className="font-medium">{goalName}</h3>
					</div>
					<div className="space-y-4 pl-7">
						{cases.map((useCase) => (
							<div key={useCase.id} className="space-y-1">
								<p className="whitespace-pre-line">
									{useCase.description}
								</p>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

// Component to display technique limitations
function TechniqueLimitations({
	limitations,
}: {
	limitations: TechniqueLimitation[];
}) {
	if (!limitations || limitations.length === 0) {
		return (
			<p className="text-muted-foreground">No limitations specified.</p>
		);
	}

	return (
		<div className="space-y-4">
			{limitations.map((limitation) => {
				// Try to parse the nested JSON in the description field
				const parsedDescription = limitation.description;
				try {
					// Try to parse the string as JSON
					const parsedData = JSON.parse(limitation.description);

					// If it's an array with objects containing description fields, extract them
					if (Array.isArray(parsedData) && parsedData.length > 0) {
						return (
							<div key={limitation.id} className="space-y-2">
								{parsedData.map((item, index) => (
									<div
										key={index}
										className="flex items-start gap-2 py-1"
									>
										<ArrowRight
											className="h-4 w-4 text-primary mt-1 flex-shrink-0"
											aria-hidden="true"
										/>
										<span>{item.description || item}</span>
									</div>
								))}
							</div>
						);
					}
				} catch {
					// If parsing fails, use the original description
				}

				return (
					<div
						key={limitation.id}
						className="flex items-start gap-2 py-1"
					>
						<ArrowRight
							className="h-4 w-4 text-primary mt-1 flex-shrink-0"
							aria-hidden="true"
						/>
						<span>{parsedDescription}</span>
					</div>
				);
			})}
		</div>
	);
}

export default function TechniqueDetailPage() {
	const params = useParams();
	const id = Number(params.id);

	// This would be replaced with actual auth state - for now always false
	const isAuthenticated = false;

	const { data: technique, isLoading, error } = useTechniqueDetail(id);

	// Debug logging - can be removed in production
	useEffect(() => {
		if (technique) {
			console.log("Technique data loaded:", technique);
		}
	}, [technique]);

	if (isLoading) {
		return (
			<MainLayout>
				<div className="flex justify-center items-center py-12">
					<Loader2
						className="h-8 w-8 animate-spin text-primary"
						aria-hidden="true"
					/>
					<span className="ml-2">Loading technique details...</span>
				</div>
			</MainLayout>
		);
	}

	if (error || !technique) {
		return (
			<MainLayout>
				<div className="flex flex-col items-center justify-center py-20">
					<h1 className="text-2xl font-bold mb-4">
						Error Loading Technique
					</h1>
					<p className="text-muted-foreground mb-8">
						There was an error loading this technique. It may not
						exist or you may not have permission to view it.
					</p>
					<Button asChild>
						<Link href="/techniques">Back to Techniques</Link>
					</Button>
				</div>
			</MainLayout>
		);
	}

	// Get applicable models for this technique (if model-specific)
	const applicableModels =
		technique.model_dependency === "Model-Specific"
			? findApplicableModels(technique.id)
			: [];

	// Helper function to parse category tags
	const parseCategoryTags = (categoryTagsStr: string) => {
		if (!categoryTagsStr) return [];

		return categoryTagsStr
			.split("#")
			.filter((tag) => tag.trim().length > 0)
			.map((tag) => {
				const parts = tag.trim().split("/");
				// Format category name (remove hyphens, title case)
				const formatName = (name: string) => {
					return name
						.split("-")
						.map(
							(word) =>
								word.charAt(0).toUpperCase() + word.slice(1)
						)
						.join(" ");
				};

				return {
					category: formatName(parts[0]),
					subcategory: parts.length > 1 ? formatName(parts[1]) : null,
				};
			});
	};

	const categoryTags = parseCategoryTags(technique.category_tags);

	// Map assurance goals to their respective icons
	const goalIcons = {
		Explainability: <Brain className="h-5 w-5" />,
		Fairness: <Scale className="h-5 w-5" />,
		Security: <Shield className="h-5 w-5" />,
		Safety: <ShieldCheck className="h-5 w-5" />,
		Reliability: <CheckCircle className="h-5 w-5" />,
		Transparency: <Eye className="h-5 w-5" />,
		Privacy: <Lock className="h-5 w-5" />,
	};

	return (
		<TooltipProvider>
			<MainLayout>
				{/* Header section */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Main content */}
					<div className="lg:col-span-2 space-y-8">
						<div className="mb-6">
							<h1 className="text-3xl font-bold">
								{technique.name}
							</h1>
						</div>
						<Section title="Description">
							<div className="prose max-w-none">
								<p className="whitespace-pre-line">
									{technique.description}
								</p>
							</div>
						</Section>

						<Section title="Example Use Cases">
							<TechniqueExampleUseCases
								useCases={technique.example_use_cases}
							/>
						</Section>

						<Section title="Limitations">
							<TechniqueLimitations
								limitations={technique.limitations}
							/>
						</Section>

						<Section title="Resources">
							<TechniqueResources
								resources={technique.resources}
							/>
						</Section>
					</div>

					{/* Sidebar with technique attributes */}
					<div>
						<Card className="sticky top-4 shadow-sm">
							<CardHeader className="pb-3 border-b">
								<CardTitle className="text-lg font-semibold">
									Technique Attributes
									<span
										className="ml-1 inline-flex"
										title="Classification metadata for this technique"
									>
										<Info className="h-4 w-4 text-muted-foreground" />
									</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								{/* Assurance Goals with Icons */}
								<div className="space-y-2">
									<h3 className="text-sm font-medium flex items-center">
										Assurance Goals
										<span
											className="ml-1 inline-flex"
											title="The primary goals that this technique helps achieve"
										>
											<Info className="h-4 w-4 text-muted-foreground" />
										</span>
									</h3>
									<div className="flex flex-wrap gap-3">
										{technique.assurance_goals.map(
											(goal) => (
												<div
													key={goal.id}
													className="flex items-center gap-2 p-2 bg-secondary rounded-md"
													title={goal.name}
												>
													{goalIcons[
														goal.name as keyof typeof goalIcons
													] || (
														<Info className="h-5 w-5" />
													)}
													<span className="font-medium text-sm">
														{goal.name}
													</span>
												</div>
											)
										)}
									</div>
								</div>

								{/* Categories (from category tags) */}
								{technique.category_tags &&
									categoryTags.length > 0 && (
										<div className="space-y-2">
											<h3 className="text-sm font-medium flex items-center">
												Categories
												<span
													className="ml-1 inline-flex"
													title="Classification categories for this technique"
												>
													<Info className="h-4 w-4 text-muted-foreground" />
												</span>
											</h3>
											<div className="space-y-2">
												{categoryTags.map(
													(tag, index) => (
														<div
															key={index}
															className="flex justify-between items-center text-sm py-1 border-b last:border-0 border-muted"
														>
															<span>
																{tag.category}
															</span>
															{tag.subcategory && (
																<Badge
																	variant="outline"
																	className="text-xs"
																>
																	{
																		tag.subcategory
																	}
																</Badge>
															)}
														</div>
													)
												)}
											</div>
										</div>
									)}

								{/* Ratings */}
								{technique.complexity_rating ? (
									<div className="space-y-2">
										<h3 className="text-sm font-medium flex items-center">
											Complexity
										</h3>
										<StarRating
											rating={technique.complexity_rating}
											maxRating={5}
											className="text-amber-400"
											aria-label={`Complexity rating: ${technique.complexity_rating} out of 5`}
										/>
									</div>
								) : null}

								{technique.computational_cost_rating ? (
									<div className="space-y-2">
										<h3 className="text-sm font-medium flex items-center">
											Computational Cost
										</h3>
										<StarRating
											rating={
												technique.computational_cost_rating
											}
											maxRating={5}
											className="text-amber-400"
											aria-label={`Computational cost rating: ${technique.computational_cost_rating} out of 5`}
										/>
									</div>
								) : null}

								{/* Model Dependency */}
								<div className="space-y-2">
									<h3 className="text-sm font-medium flex items-center">
										Model Dependency
										<span
											className="ml-1 inline-flex"
											title="Indicates whether this technique requires access to model internals"
										>
											<Info className="h-4 w-4 text-muted-foreground" />
										</span>
									</h3>
									<div>
										<Badge
											variant="outline"
											className="text-sm"
										>
											{technique.model_dependency}
										</Badge>
									</div>
								</div>

								{/* Applicable Models Section (for model-specific techniques) */}
								{technique.model_dependency ===
									"Model-Specific" &&
									applicableModels.length > 0 && (
										<div className="space-y-2">
											<h3 className="text-sm font-medium flex items-center">
												Applicable Models
												<span
													className="ml-1 inline-flex"
													title="Specific model architectures this technique can be applied to"
												>
													<Info className="h-4 w-4 text-muted-foreground" />
												</span>
											</h3>
											<div className="flex flex-wrap gap-2">
												{applicableModels.map(
													(model) => (
														<Badge
															key={model}
															variant="outline"
															className="flex items-center gap-1.5 text-xs py-1"
														>
															<Cpu className="h-3 w-3" />
															<span>{model}</span>
														</Badge>
													)
												)}
											</div>
										</div>
									)}

								{/* Goal-Specific Attributes section */}
								<div className="space-y-3 border-t pt-3">
									<h3 className="text-sm font-medium flex items-center">
										Goal-Specific Attributes
										<span
											className="ml-1 inline-flex"
											title="Attributes specific to the technique's assurance goals"
										>
											<Info className="h-4 w-4 text-muted-foreground" />
										</span>
									</h3>

									{/* Add Explanatory Scope and other attributes */}
									{technique.attribute_values &&
										technique.attribute_values.length > 0 &&
										Object.entries(
											technique.attribute_values.reduce(
												(acc, attr) => {
													const type =
														attr.attribute_type_name;
													if (!acc[type]) {
														acc[type] = [];
													}
													acc[type].push(attr);
													return acc;
												},
												{} as Record<
													string,
													AttributeValue[]
												>
											)
										).map(([type, values]) => (
											<div
												className="space-y-1"
												key={type}
											>
												<h4 className="text-xs text-muted-foreground">
													{type}
												</h4>
												<div className="flex flex-wrap gap-2">
													{values.map((value) => (
														<Badge
															key={value.id}
															variant="outline"
															className="text-sm"
														>
															{value.name}
														</Badge>
													))}
												</div>
											</div>
										))}
								</div>

								{/* Tags */}
								{technique.tags &&
									technique.tags.length > 0 && (
										<div className="space-y-2">
											<h3 className="text-sm font-medium flex items-center">
												Tags
												<span
													className="ml-1 inline-flex"
													title="Keywords associated with this technique"
												>
													<Info className="h-4 w-4 text-muted-foreground" />
												</span>
											</h3>
											<div className="flex flex-wrap gap-2">
												{technique.tags.map((tag) => (
													<Badge
														key={tag.id}
														variant="secondary"
													>
														{tag.name}
													</Badge>
												))}
											</div>
										</div>
									)}
							</CardContent>

							{/* Edit section - delete will be accessible from edit form later */}
							<CardFooter className="flex flex-col items-stretch pt-4 pb-4 border-t">
								<div
									className={`bg-muted/50 rounded p-3 mb-4 flex items-center ${
										isAuthenticated ? "hidden" : ""
									}`}
								>
									<Lock
										className="h-4 w-4 mr-2 text-muted-foreground"
										aria-hidden="true"
									/>
									<p className="text-sm text-muted-foreground">
										Authentication is required to edit a
										technique. Not implemented yet.
									</p>
								</div>
								<Button
									asChild
									variant="outline"
									className="w-full"
									disabled={!isAuthenticated}
								>
									<Link
										href="#"
										aria-label="Edit technique (disabled)"
									>
										<Edit
											className="h-4 w-4 mr-2"
											aria-hidden="true"
										/>{" "}
										Edit Technique
									</Link>
								</Button>
							</CardFooter>
						</Card>
					</div>
				</div>

				{/* Back button at the bottom */}
				<div className="mt-8">
					<Button asChild variant="outline" size="sm">
						<Link
							href="/techniques"
							className="flex items-center gap-2"
						>
							<ArrowLeft className="h-4 w-4" aria-hidden="true" />
							<span>Back to Techniques</span>
						</Link>
					</Button>
				</div>
			</MainLayout>
		</TooltipProvider>
	);
}
