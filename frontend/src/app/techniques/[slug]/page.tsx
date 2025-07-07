// src/app/techniques/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useTechniqueDetail, useMultipleTechniqueNames } from "@/lib/api/hooks";
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
	FileCode2,
	Book,
	Package,
	GraduationCap,
	Info,
	Loader2,
	Lock,
	NotebookText,
	Rss,
	Scale,
	Scroll,
	Shield,
	ShieldCheck,
	Tag,
	Layers,
	Database,
	Clock,
} from "lucide-react";
import {
	TechniqueResource,
	TechniqueExampleUseCase,
	TechniqueLimitation,
} from "@/lib/types";
import {
	getApplicableModels,
	getDataTypes,
	getLifecycleStages,
	groupTagsByPrefix,
	formatTagDisplay,
	getTagValue,
} from "@/lib/utils";


// Helper component for section containers
function Section({
	title,
	children,
	noBorder = false,
}: {
	title: string;
	children: React.ReactNode;
	noBorder?: boolean;
}) {
	return (
		<div className="mb-8">
			<h2
				className="text-xl font-semibold mb-4"
				id={title.toLowerCase().replace(/\s+/g, "-")}
			>
				{title}
			</h2>
			{noBorder ? (
				<>{children}</>
			) : (
				<div className="bg-card rounded-lg border p-4 shadow-sm">
					{children}
				</div>
			)}
		</div>
	);
}

function TechniqueResources({ resources }: { resources: TechniqueResource[] }) {
	if (!resources || resources.length === 0) {
		return <p className="text-muted-foreground">No resources available.</p>;
	}
	
	// Debug: Log resources to see what we're actually getting from the API
	console.log("Resources from API:", JSON.stringify(resources, null, 2));

	// Function to get the appropriate icon for source type
	const getResourceIcon = (resource: TechniqueResource) => {
		const sourceType = (resource.source_type || "unknown").toLowerCase();
		
		switch (sourceType) {
			case "documentation":
				return <FileCode2 className="h-5 w-5" aria-hidden="true" />;
			case "tutorial":
				return <GraduationCap className="h-5 w-5" aria-hidden="true" />;
			case "software_package":
				return <Package className="h-5 w-5" aria-hidden="true" />;
			case "technical_paper":
				return <NotebookText className="h-5 w-5" aria-hidden="true" />;
			case "review_paper":
				return <Scroll className="h-5 w-5" aria-hidden="true" />;
			case "introductory_paper":
				return <Scroll className="h-5 w-5" aria-hidden="true" />;
			case "paper":
				return <Scroll className="h-5 w-5" aria-hidden="true" />;
			case "blog":
				return <Rss className="h-5 w-5" aria-hidden="true" />;
			case "implementation":
				return <Package className="h-5 w-5" aria-hidden="true" />;
			default:
				return <Book className="h-5 w-5" aria-hidden="true" />;
		}
	};
	

	// Format source type for display
	const formatSourceType = (sourceType: string): string => {
		if (!sourceType) return "Unknown";
		
		// Convert snake_case to Title Case
		return sourceType
			.split(/_|\s/)
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	};

	return (
		<>
			{resources.map((resource) => (
				<div
					key={resource.id}
					className="border rounded-md p-4 mb-4 hover:border-primary transition-colors"
				>
					<div className="flex">
						<div className="flex-shrink-0 mr-3 mt-1">
							{getResourceIcon(resource)}
						</div>
						
						<div className="flex-grow">
							<div className="flex items-center justify-between">
								<h3 className="font-medium">
									{resource.title}
								</h3>
								<Button
									variant="outline"
									size="sm"
									asChild
									className="flex items-center gap-1"
								>
									<a href={resource.url} target="_blank" rel="noopener noreferrer">
										<ExternalLink
											className="h-4 w-4"
											aria-hidden="true"
										/>
										<span>View Resource</span>
									</a>
								</Button>
							</div>

							{/* Display metadata - all with same style */}
							<div className="mt-2 text-sm text-muted-foreground">
								{resource.source_type && (
									<div>
										Source Type: {formatSourceType(resource.source_type)}
									</div>
								)}
								
								{resource.authors && (
									<div>
										Authors: {resource.authors}
									</div>
								)}
								{resource.publication_date && (
									<div>
										Published: {resource.publication_date}
									</div>
								)}
							</div>

							{resource.description && (
								<p className="text-sm mt-2 text-muted-foreground">
									{resource.description}
								</p>
							)}
						</div>
					</div>
				</div>
			))}
		</>
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
				// No need to parse JSON anymore as the backend now handles it properly
				return (
					<div
						key={limitation.id}
						className="flex items-start gap-2 py-1"
					>
						<ArrowRight
							className="h-4 w-4 text-primary mt-1 flex-shrink-0"
							aria-hidden="true"
						/>
						<span>{limitation.description}</span>
					</div>
				);
			})}
		</div>
	);
}

// Component to display related techniques
function RelatedTechniques({ 
	techniqueSlugs 
}: { 
	techniqueSlugs: string[];
}) {
	const { techniques, isLoading, isError } = useMultipleTechniqueNames(techniqueSlugs);

	if (!techniqueSlugs || techniqueSlugs.length === 0) {
		return <p className="text-muted-foreground">No related techniques specified.</p>;
	}

	if (isLoading) {
		return (
			<div className="flex items-center gap-2">
				<Loader2 className="h-4 w-4 animate-spin" />
				<span className="text-sm text-muted-foreground">Loading related techniques...</span>
			</div>
		);
	}

	if (isError) {
		return (
			<p className="text-sm text-muted-foreground">
				Error loading related techniques. They may not exist or you may not have permission to view them.
			</p>
		);
	}

	return (
		<div className="space-y-2">
			<p className="text-sm text-muted-foreground mb-3">
				These techniques are related or complementary to this one:
			</p>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				{techniques.map((technique) => (
					<Link
						key={technique.slug}
						href={`/techniques/${technique.slug}`}
						className="flex items-center gap-2 p-3 rounded-md border hover:border-primary transition-colors"
					>
						<Layers className="h-4 w-4 text-primary" />
						<span className="text-sm font-medium">
							{technique.name}
							{technique.acronym && <span className="text-muted-foreground ml-1">({technique.acronym})</span>}
						</span>
						<ArrowRight className="h-4 w-4 ml-auto" />
					</Link>
				))}
			</div>
		</div>
	);
}

export default function TechniqueDetailPage() {
	const params = useParams();
	const slug = params.slug as string;

	// This would be replaced with actual auth state - for now always false
	const isAuthenticated = false;

	const { data: technique, isLoading, error } = useTechniqueDetail(slug);

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

	// Extract key information from tags
	const applicableModels = getApplicableModels(technique.tags);
	const dataTypes = getDataTypes(technique.tags);
	const lifecycleStages = getLifecycleStages(technique.tags);
	const groupedTags = groupTagsByPrefix(technique.tags);

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
								{technique.acronym && (
									<span className="text-2xl text-muted-foreground ml-2">
										({technique.acronym})
									</span>
								)}
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

						{/* Related Techniques Section */}
						{technique.related_techniques && technique.related_techniques.length > 0 && (
							<Section title="Related Techniques">
								<RelatedTechniques
									techniqueSlugs={technique.related_techniques}
								/>
							</Section>
						)}

						<Section title="Resources" noBorder={true}>
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


								{/* Applicable Models Section */}
								{applicableModels.length > 0 && (
										<div className="space-y-2">
											<h3 className="text-sm font-medium flex items-center">
												Applicable Models
												<span
													className="ml-1 inline-flex"
													title="Model architectures this technique can be applied to"
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
															<span>{formatTagDisplay(model)}</span>
														</Badge>
													)
												)}
											</div>
										</div>
									)}

								{/* Data Types Section */}
								{dataTypes.length > 0 && (
									<div className="space-y-2">
										<h3 className="text-sm font-medium flex items-center">
											Data Types
											<span
												className="ml-1 inline-flex"
												title="Types of data this technique can work with"
											>
												<Info className="h-4 w-4 text-muted-foreground" />
											</span>
										</h3>
										<div className="flex flex-wrap gap-2">
											{dataTypes.map(
												(dataType) => (
													<Badge
														key={dataType}
														variant="outline"
														className="flex items-center gap-1.5 text-xs py-1"
													>
														<Database className="h-3 w-3" />
														<span>{formatTagDisplay(dataType)}</span>
													</Badge>
												)
											)}
										</div>
									</div>
								)}

								{/* Lifecycle Stages Section */}
								{lifecycleStages.length > 0 && (
									<div className="space-y-2">
										<h3 className="text-sm font-medium flex items-center">
											Lifecycle Stages
											<span
												className="ml-1 inline-flex"
												title="When in the ML lifecycle this technique can be applied"
											>
												<Info className="h-4 w-4 text-muted-foreground" />
											</span>
										</h3>
										<div className="flex flex-wrap gap-2">
											{lifecycleStages.map(
												(stage) => (
													<Badge
														key={stage}
														variant="outline"
														className="flex items-center gap-1.5 text-xs py-1"
													>
														<Clock className="h-3 w-3" />
														<span>{formatTagDisplay(stage)}</span>
													</Badge>
												)
											)}
										</div>
									</div>
								)}

								{/* All Tags Section */}
								{Object.keys(groupedTags).length > 0 && (
									<div className="space-y-3 border-t pt-3">
										<h3 className="text-sm font-medium flex items-center">
											All Tags
											<span
												className="ml-1 inline-flex"
												title="All tags associated with this technique"
											>
												<Info className="h-4 w-4 text-muted-foreground" />
											</span>
										</h3>
										{Object.entries(groupedTags)
											.filter(([prefix]) => !['applicable-models', 'data-type', 'lifecycle-stage'].includes(prefix))
											.map(([prefix, tags]) => {
												// Special handling for assurance-goal-category to show subcategories only
												if (prefix === 'assurance-goal-category') {
													// Filter out tags that only have the parent goal (no subcategories)
													const subcategoryTags = tags.filter(tag => {
														const parts = tag.name.split('/');
														return parts.length > 2; // prefix/goal/subcategory (at least 3 parts)
													});
													
													if (subcategoryTags.length === 0) return null;
													
													return (
														<div key={prefix} className="space-y-1">
															<h4 className="text-xs text-muted-foreground">
																Assurance Goal Sub-Categories
															</h4>
															<div className="flex flex-wrap gap-1.5">
																{subcategoryTags.map((tag) => {
																	// Extract subcategory parts (everything after prefix/goal/)
																	const parts = tag.name.split('/');
																	const subcategories = parts.slice(2).join('/');
																	return (
																		<Badge
																			key={tag.id}
																			variant="secondary"
																			className="text-xs flex items-center gap-1"
																		>
																			<Tag className="h-3 w-3" />
																			<span>{formatTagDisplay(subcategories)}</span>
																		</Badge>
																	);
																})}
															</div>
														</div>
													);
												}
												
												// Standard handling for other tag prefixes
												return (
													<div key={prefix} className="space-y-1">
														<h4 className="text-xs text-muted-foreground">
															{formatTagDisplay(prefix)}
														</h4>
														<div className="flex flex-wrap gap-1.5">
															{tags.map((tag) => (
																<Badge
																	key={tag.id}
																	variant="secondary"
																	className="text-xs flex items-center gap-1"
																>
																	<Tag className="h-3 w-3" />
																	<span>{formatTagDisplay(getTagValue(tag.name))}</span>
																</Badge>
															))}
														</div>
													</div>
												);
											})}
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
