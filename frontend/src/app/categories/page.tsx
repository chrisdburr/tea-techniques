"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { useAssuranceGoals, useCategories, useTechniques } from "@/lib/api/hooks";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import {
    Brain,
    Scale,
    Lock,
    CheckCircle,
    ShieldCheck,
    Eye,
    Circle,
    ExternalLink,
    ArrowRight,
    ChevronsRight,
    AlertCircle,
    Loader2
} from "lucide-react";
import GoalIcon from "@/components/technique/GoalIcon";
import { formatCategoryName } from "@/components/technique/CategoryTag";
import { AssuranceGoal, Category, Technique } from "@/lib/types";

// Type for the goal descriptions
interface GoalDescription {
    description: string;
    icon: JSX.Element;
    examples: string[];
}

// Type for model dependency info
interface ModelDependencyInfo {
    description: string;
    advantages: string[];
    examples: string[];
}

// Define goal descriptions with accessibility-friendly colors
const goalDescriptions: Record<string, GoalDescription> = {
    Explainability: {
        description: "Techniques that help explain how AI models make decisions, allowing stakeholders to understand the reasoning behind machine outputs.",
        icon: <Brain className="h-10 w-10" aria-hidden="true" />,
        examples: ["SHAP", "LIME", "Partial Dependence Plots"]
    },
    Fairness: {
        description: "Methods to identify, measure, and mitigate bias and discrimination in AI systems, ensuring equitable treatment across different groups.",
        icon: <Scale className="h-10 w-10" aria-hidden="true" />,
        examples: ["Demographic Parity", "Fairness Constraints", "Counterfactual Fairness"]
    },
    Privacy: {
        description: "Approaches to protect sensitive information when developing and deploying AI systems while preserving utility of the data and models.",
        icon: <Lock className="h-10 w-10" aria-hidden="true" />,
        examples: ["Differential Privacy", "Federated Learning", "Homomorphic Encryption"]
    },
    Reliability: {
        description: "Techniques to ensure AI systems operate consistently and predictably under varying conditions, with appropriate uncertainty quantification.",
        icon: <CheckCircle className="h-10 w-10" aria-hidden="true" />,
        examples: ["Conformal Prediction", "Empirical Calibration", "Uncertainty Quantification"]
    },
    Safety: {
        description: "Methods to make AI systems robust against misuse, adversarial attacks, and unexpected failures to prevent harm to users and society.",
        icon: <ShieldCheck className="h-10 w-10" aria-hidden="true" />,
        examples: ["Red Teaming", "Anomaly Detection", "Runtime Monitoring"]
    },
    Transparency: {
        description: "Practices for documenting and communicating AI development processes, capabilities, and limitations to appropriate stakeholders.",
        icon: <Eye className="h-10 w-10" aria-hidden="true" />,
        examples: ["Model Cards", "Datasheets", "Audit Trails"]
    },
};

// Define model dependency information
const modelDependencyInfo: Record<string, ModelDependencyInfo> = {
    "Model-Agnostic": {
        description: "Techniques that can be applied to any machine learning model regardless of its architecture or type. These methods treat the model as a 'black box' and only require access to its inputs and outputs.",
        advantages: [
            "Greater flexibility and portability across different model types",
            "Can be applied to proprietary models without access to internals",
            "Generally simpler to implement and use",
            "More future-proof as they work with new model architectures"
        ],
        examples: ["LIME", "SHAP", "Permutation Importance", "Partial Dependence Plots"]
    },
    "Model-Specific": {
        description: "Techniques that are designed for or require access to specific model architectures, internal components, or training processes. These methods typically leverage model internals for deeper insights.",
        advantages: [
            "Can provide more detailed and accurate explanations",
            "May be more computationally efficient",
            "Can tap into model-specific structures for better insights",
            "Often yield more granular and precise results"
        ],
        examples: ["Attention Visualization", "Integrated Gradients", "Grad-CAM", "Layer-wise Relevance Propagation"]
    }
};

// Type for category tree items
type CategoryTreeItem = {
    name: string;
    subcategories: string[];
    techniques: number;
}

export default function CategoriesPage() {
    // Local state
    const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
    const [featuredExamplesByGoal, setFeaturedExamplesByGoal] = useState<Record<string, Technique[]>>({});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Fetch data from API
    const {
        // data: assuranceGoalsData,
        isLoading: isLoadingGoals,
        error: goalsError
    } = useAssuranceGoals();

    const {
        data: categoriesData,
        isLoading: isLoadingCategories,
        error: categoriesError
    } = useCategories();

    const {
        data: techniquesData,
        isLoading: isLoadingTechniques,
        error: techniquesError
    } = useTechniques();

    // Check for any errors
    useEffect(() => {
        if (goalsError) {
            setErrorMessage("Error loading assurance goals. Please try again later.");
        } else if (categoriesError) {
            setErrorMessage("Error loading categories. Please try again later.");
        } else if (techniquesError) {
            setErrorMessage("Error loading techniques. Please try again later.");
        } else {
            setErrorMessage(null);
        }
    }, [goalsError, categoriesError, techniquesError]);

    // Organize techniques and categories when data is available
    useEffect(() => {
        if (categoriesData?.results && techniquesData?.results) {
            const techniquesByCategory: Record<string, Technique[]> = {};
            const examplesByGoal: Record<string, Technique[]> = {};

            // Process all techniques
            techniquesData.results.forEach((technique: Technique) => {
                if (technique.category_tags) {
                    const tags = technique.category_tags.split('#').filter(Boolean);

                    // Group techniques by category
                    tags.forEach((tag: string) => {
                        const mainCategory = tag.split('/')[0];
                        if (!techniquesByCategory[mainCategory]) {
                            techniquesByCategory[mainCategory] = [];
                        }
                        techniquesByCategory[mainCategory].push(technique);
                    });

                    // Group techniques by assurance goal (for featured examples)
                    technique.assurance_goals.forEach((goal: AssuranceGoal) => {
                        if (!examplesByGoal[goal.name]) {
                            examplesByGoal[goal.name] = [];
                        }

                        // Only add if we don't already have 3 examples and this one isn't already included
                        if (examplesByGoal[goal.name].length < 3 &&
                            !examplesByGoal[goal.name].some(t => t.id === technique.id)) {
                            examplesByGoal[goal.name].push(technique);
                        }
                    });
                }
            });

            // Update featured examples state
            setFeaturedExamplesByGoal(examplesByGoal);
        }
    }, [categoriesData, techniquesData]);

    // Prepare the categories by goal mapping
    const categoriesByGoal: Record<string, CategoryTreeItem[]> = {};

    if (categoriesData?.results && techniquesData?.results) {
        // First, group techniques by category tag for counting
        const techniquesByCategory: Record<string, Technique[]> = {};

        techniquesData.results.forEach((technique: Technique) => {
            if (technique.category_tags) {
                const tags = technique.category_tags.split('#').filter(Boolean);

                tags.forEach((tag: string) => {
                    const mainCategory = tag.split('/')[0];
                    if (!techniquesByCategory[mainCategory]) {
                        techniquesByCategory[mainCategory] = [];
                    }
                    techniquesByCategory[mainCategory].push(technique);
                });
            }
        });

        // Then create the category tree
        categoriesData.results.forEach((category: Category) => {
            const goalName = category.assurance_goal_name;

            if (!categoriesByGoal[goalName]) {
                categoriesByGoal[goalName] = [];
            }

            // Find all subcategories for this category
            const subcategories = categoriesData.results
                .filter(c => c.name.startsWith(`${category.name}/`))
                .map(c => c.name.split('/')[1]);

            // Count techniques in this category
            const techCount = techniquesByCategory[category.name]?.length || 0;

            categoriesByGoal[goalName].push({
                name: category.name,
                subcategories: subcategories,
                techniques: techCount
            });
        });
    }

    // Generic loading skeleton for cards
    const LoadingSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="h-64">
                    <CardHeader>
                        <div className="h-8 w-3/4 bg-muted animate-pulse rounded-md" />
                        <div className="h-4 w-1/2 mt-2 bg-muted animate-pulse rounded-md" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-4 w-full mt-2 bg-muted animate-pulse rounded-md" />
                        <div className="h-4 w-full mt-2 bg-muted animate-pulse rounded-md" />
                        <div className="h-4 w-3/4 mt-2 bg-muted animate-pulse rounded-md" />
                    </CardContent>
                    <CardFooter>
                        <div className="h-9 w-full bg-muted animate-pulse rounded-md" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    );

    // Determine loading state
    const isLoading = isLoadingGoals || isLoadingCategories || isLoadingTechniques;

    return (
        <MainLayout>
            <div className="space-y-8">
                {/* Page Header */}
                <section>
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold">Understanding the TEA Techniques</h1>
                        <p className="text-lg text-muted-foreground mt-2">
                            A guide to help you navigate and understand the organization of techniques in our database
                        </p>
                    </div>

                    <div className="prose max-w-none my-8">
                        <p>
                            The TEA Techniques database organizes responsible AI methods along several dimensions to help you find the right approaches for your needs. Each technique is categorized by its <strong>assurance goal</strong>, <strong>model dependency</strong>, and technical <strong>category</strong>. Techniques are also rated for <strong>complexity</strong> and <strong>computational cost</strong> to help you assess implementation requirements.
                        </p>
                    </div>
                </section>

                {/* Error message (if any) */}
                {errorMessage && (
                    <div role="alert" className="relative w-full rounded-lg border p-4 border-destructive/50 text-destructive dark:border-destructive my-4">
                        <AlertCircle className="h-4 w-4 absolute left-4 top-4 text-destructive" />
                        <h5 className="mb-1 font-medium leading-none tracking-tight pl-7">Error</h5>
                        <div className="text-sm [&_p]:leading-relaxed pl-7">{errorMessage}</div>
                    </div>
                )}

                {/* Loading indicator for the whole page (only shown initially) */}
                {isLoading && Object.keys(categoriesByGoal).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Loading content...</p>
                    </div>
                )}

                {/* Main Content - Only shown when not in initial loading state */}
                {(!isLoading || Object.keys(categoriesByGoal).length > 0) && (
                    <>
                        {/* Assurance Goals Section */}
                        <section className="space-y-6" aria-labelledby="assurance-goals-heading">
                            <h2 id="assurance-goals-heading" className="text-2xl font-bold">Assurance Goals</h2>
                            <p className="text-muted-foreground">
                                Assurance goals represent the primary objectives that techniques help achieve in responsible AI development. Each technique is associated with at least one of these goals.
                            </p>

                            <Tabs defaultValue="Explainability" className="w-full">
                                <div className="overflow-x-auto pb-1">
                                    <TabsList className="w-full flex justify-start space-x-2">
                                        {Object.keys(goalDescriptions).map((goalName) => (
                                            <TabsTrigger key={goalName} value={goalName} className="flex items-center gap-2 whitespace-nowrap">
                                                <GoalIcon goalName={goalName} size={14} />
                                                <span>{goalName}</span>
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </div>

                                {Object.keys(goalDescriptions).map((goalName) => (
                                    <TabsContent key={goalName} value={goalName} className="mt-4">
                                        {isLoadingTechniques ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {[1, 2, 3].map((i) => (
                                                    <Card key={i} className="h-64">
                                                        <CardHeader className="pb-2">
                                                            <div className="h-6 w-3/4 bg-muted animate-pulse rounded-md" />
                                                            <div className="h-4 w-1/2 mt-2 bg-muted animate-pulse rounded-md" />
                                                        </CardHeader>
                                                        <CardContent className="flex-grow">
                                                            <div className="h-4 w-full mt-2 bg-muted animate-pulse rounded-md" />
                                                            <div className="h-4 w-full mt-2 bg-muted animate-pulse rounded-md" />
                                                            <div className="h-4 w-3/4 mt-2 bg-muted animate-pulse rounded-md" />
                                                        </CardContent>
                                                        <CardFooter className="pt-0">
                                                            <div className="h-9 w-full bg-muted animate-pulse rounded-md" />
                                                        </CardFooter>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {featuredExamplesByGoal[goalName]?.length > 0 ? (
                                                    featuredExamplesByGoal[goalName].map((technique) => (
                                                        <Card key={technique.id} className="h-full flex flex-col">
                                                            <CardHeader className="pb-2">
                                                                <CardTitle className="text-lg truncate" title={technique.name}>
                                                                    {technique.name}
                                                                </CardTitle>
                                                                <CardDescription className="truncate">
                                                                    {technique.model_dependency}
                                                                </CardDescription>
                                                            </CardHeader>
                                                            <CardContent className="flex-grow">
                                                                <p className="text-sm line-clamp-3">{technique.description}</p>
                                                            </CardContent>
                                                            <CardFooter className="pt-0">
                                                                <Button asChild variant="outline" className="w-full">
                                                                    <Link href={`/techniques/${technique.id}`} aria-label={`View details for ${technique.name}`}>
                                                                        View Details <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
                                                                    </Link>
                                                                </Button>
                                                            </CardFooter>
                                                        </Card>
                                                    ))
                                                ) : (
                                                    <div className="col-span-full text-center py-8 text-muted-foreground italic">
                                                        No example techniques available
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex justify-center mt-6">
                                            <Button asChild>
                                                <Link
                                                    href={`/techniques?assurance_goal=${goalName}`}
                                                    aria-label={`Browse all ${goalName} techniques`}
                                                >
                                                    Browse All {goalName} Techniques <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </section>

                        {/* Model Dependency Section */}
                        <section className="space-y-6 mt-12" aria-labelledby="model-dependency-heading">
                            <h2 id="model-dependency-heading" className="text-2xl font-bold">Model Dependency</h2>
                            <p className="text-muted-foreground">
                                Model dependency indicates whether a technique requires access to the internal components of a model or can treat it as a &ldquo;black box&rdquo;. This is an important consideration for choosing appropriate techniques.
                            </p>

                            {isLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    {[1, 2].map((i) => (
                                        <Card key={i} className="h-96">
                                            <CardHeader>
                                                <div className="h-6 w-1/2 bg-muted animate-pulse rounded-md" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="h-4 w-full mt-2 bg-muted animate-pulse rounded-md" />
                                                <div className="h-4 w-full mt-2 bg-muted animate-pulse rounded-md" />
                                                <div className="h-4 w-3/4 mt-2 bg-muted animate-pulse rounded-md" />
                                                <div className="mt-4">
                                                    <div className="h-4 w-1/4 mt-4 bg-muted animate-pulse rounded-md" />
                                                    <div className="h-4 w-full mt-2 bg-muted animate-pulse rounded-md" />
                                                    <div className="h-4 w-full mt-2 bg-muted animate-pulse rounded-md" />
                                                </div>
                                            </CardContent>
                                            <CardFooter>
                                                <div className="h-9 w-full bg-muted animate-pulse rounded-md" />
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    {Object.entries(modelDependencyInfo).map(([dependency, info]) => (
                                        <Card key={dependency} className="h-full flex flex-col">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Badge variant={dependency === "Model-Agnostic" ? "outline" : "default"}>
                                                        {dependency}
                                                    </Badge>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex-grow">
                                                <p className="mb-4">{info.description}</p>
                                                <div className="space-y-4">
                                                    <div>
                                                        <h4 className="font-semibold text-sm">Advantages:</h4>
                                                        <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
                                                            {info.advantages.map((advantage, i) => (
                                                                <li key={i}>{advantage}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-sm">Example Techniques:</h4>
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {info.examples.map((example, i) => (
                                                                <Badge key={i} variant="secondary">{example}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter>
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    className="w-full"
                                                    aria-label={`Browse ${dependency} techniques`}
                                                >
                                                    <Link href={`/techniques?model_dependency=${dependency}`}>
                                                        Browse {dependency} Techniques
                                                    </Link>
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Complexity and Computational Cost Section */}
                        <section className="space-y-6 mt-12" aria-labelledby="implementation-heading">
                            <h2 id="implementation-heading" className="text-2xl font-bold">Implementation Considerations</h2>
                            <p className="text-muted-foreground">
                                Each technique is rated for complexity and computational cost to help you understand the resources required for implementation.
                            </p>

                            {isLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                                    {[1, 2].map((i) => (
                                        <Card key={i}>
                                            <CardHeader>
                                                <div className="h-6 w-3/4 bg-muted animate-pulse rounded-md" />
                                                <div className="h-4 w-1/2 mt-2 bg-muted animate-pulse rounded-md" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {[1, 2, 3].map((j) => (
                                                        <div key={j} className="flex items-center justify-between">
                                                            <div className="h-4 w-1/3 bg-muted animate-pulse rounded-md" />
                                                            <div className="h-4 w-1/3 bg-muted animate-pulse rounded-md" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Complexity Rating</CardTitle>
                                            <CardDescription>
                                                Indicates how difficult a technique is to understand and implement
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <StarRating rating={1} className="text-yellow-500" />
                                                        <span className="ml-2">Simple</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">Basic techniques with straightforward implementation</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <StarRating rating={3} className="text-yellow-500" />
                                                        <span className="ml-2">Moderate</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">Requires some expertise and careful implementation</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <StarRating rating={5} className="text-yellow-500" />
                                                        <span className="ml-2">Complex</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">Advanced techniques requiring specialist knowledge</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Computational Cost</CardTitle>
                                            <CardDescription>
                                                Indicates the computational resources needed to run the technique
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <StarRating rating={1} className="text-yellow-500" />
                                                        <span className="ml-2">Low</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">Runs efficiently on standard hardware</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <StarRating rating={3} className="text-yellow-500" />
                                                        <span className="ml-2">Medium</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">May require significant processing power or memory</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <StarRating rating={5} className="text-yellow-500" />
                                                        <span className="ml-2">High</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">Computationally intensive, may need specialized hardware</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </section>

                        {/* How to Use This Information */}
                        <section className="mt-12 border-t pt-8" aria-labelledby="how-to-use-heading">
                            <h2 id="how-to-use-heading" className="text-2xl font-bold mb-4">How to Use This Information</h2>

                            <div className="prose max-w-none">
                                <p>
                                    When selecting techniques for your responsible AI project, consider these factors:
                                </p>

                                <ol>
                                    <li>
                                        <strong>Start with your assurance goals</strong> - Identify which objectives are most important for your specific use case (e.g., explaining model decisions, ensuring fairness).
                                    </li>
                                    <li>
                                        <strong>Consider your model constraints</strong> - If you&apos;re working with a black-box model or third-party API, focus on model-agnostic techniques. If you have full access to model internals, you can leverage model-specific approaches.
                                    </li>
                                    <li>
                                        <strong>Assess your resources</strong> - Match the complexity and computational cost ratings with your team&apos;s expertise and available computing resources.
                                    </li>
                                    <li>
                                        <strong>Explore multiple techniques</strong> - Often, a combination of techniques is necessary for comprehensive responsible AI assurance.
                                    </li>
                                </ol>

                                <p>
                                    The TEA Techniques database is designed to help you navigate these considerations and find the right approaches for your needs.
                                </p>
                            </div>

                            <div className="mt-8 flex justify-center">
                                <Button asChild size="lg">
                                    <Link href="/techniques">
                                        Browse All Techniques
                                    </Link>
                                </Button>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </MainLayout>
    );
}

