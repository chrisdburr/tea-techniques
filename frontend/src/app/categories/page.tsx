"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight } from "lucide-react";
import { useAssuranceGoals, useCategories, useTechniques } from "@/lib/api/hooks";
import GoalIcon from "@/components/technique/GoalIcon";
import type { AssuranceGoal, Category, Technique } from "@/lib/types";

export default function CategoriesPage() {
    // State for the selected tab and goal
    const [selectedGoal, setSelectedGoal] = useState<string>("Explainability");
    const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<string>("");

    // Fetch assurance goals
    const { data: assuranceGoalsData, isLoading: isLoadingGoals } = useAssuranceGoals();

    // Fetch categories
    const { data: categoriesData, isLoading: isLoadingCategories } = useCategories();

    // Fetch techniques for the selected goal
    const { data: goalTechniques, isLoading: isLoadingTechniques } = useTechniques(
        { assurance_goals: selectedGoal },
        1 // First page only
    );

    // Fetch model-agnostic and model-specific example techniques
    const { data: agnosticTechniques } = useTechniques(
        { model_dependency: "Model-Agnostic" },
        1
    );

    const { data: specificTechniques } = useTechniques(
        { model_dependency: "Model-Specific" },
        1
    );

    // Detailed descriptions for each assurance goal
    const goalDescriptions: Record<string, string> = {
        Explainability: "Techniques that aim to make AI models more interpretable and their decisions more understandable to humans. These techniques help identify how models transform inputs into outputs, which features are most important for predictions, and why specific decisions are made.",
        Fairness: "Techniques that assess and mitigate bias in AI systems to ensure equitable outcomes across diverse demographic groups. These approaches help identify, measure, and reduce discrimination and unfairness in algorithmic decision-making.",
        Security: "Techniques that protect AI systems from adversarial attacks, vulnerabilities, and other security threats. These methods enhance the robustness of AI systems against manipulation and unauthorized exploitation.",
        Privacy: "Techniques that help preserve data privacy and confidentiality when developing or deploying AI systems. These approaches enable machine learning while protecting sensitive information from exposure or inference.",
        Reliability: "Techniques that ensure AI systems perform consistently and as expected across various conditions and environments. These methods improve robustness, error detection, and failure prevention in AI applications."
    };

    // Group categories by assurance goal for easier display
    const categoriesByGoal = React.useMemo(() => {
        if (!categoriesData?.results) return {};

        return categoriesData.results.reduce((acc: Record<string, Category[]>, category: Category) => {
            const goalName = category.assurance_goal_name;
            if (!acc[goalName]) {
                acc[goalName] = [];
            }
            acc[goalName].push(category);
            return acc;
        }, {});
    }, [categoriesData]);

    // Group categories by first letter for the category section
    const categoriesByFirstLetter = React.useMemo(() => {
        if (!categoriesData?.results) return {};

        return categoriesData.results.reduce((acc: Record<string, Category[]>, category: Category) => {
            const firstLetter = category.name.charAt(0).toUpperCase();
            if (!acc[firstLetter]) {
                acc[firstLetter] = [];
            }
            acc[firstLetter].push(category);
            return acc;
        }, {});
    }, [categoriesData]);

    // All unique first letters for category group tabs
    const categoryGroups = React.useMemo(() => {
        return Object.keys(categoriesByFirstLetter).sort();
    }, [categoriesByFirstLetter]);

    // Helper function to create URL with correct filter parameters
    const createFilterUrl = (filterType: string, filterValue: string) => {
        // The backend expects plural parameter names for these filters
        if (filterType === "assurance_goal") {
            return `/techniques?assurance_goals=${encodeURIComponent(filterValue)}`;
        }
        if (filterType === "category") {
            return `/techniques?categories=${encodeURIComponent(filterValue)}`;
        }
        // For model dependency, use the exact parameter name
        return `/techniques?${filterType}=${encodeURIComponent(filterValue)}`;
    };

    // Update the selected goal when tab changes
    useEffect(() => {
        if (selectedGoal && selectedGoal !== "all") {
            // You could make other adjustments here if needed
        }
    }, [selectedGoal]);

    return (
        <MainLayout>
            <div className="space-y-12">
                <section className="space-y-6">
                    <h1 className="text-3xl font-bold text-center">TEA Techniques Categories</h1>
                    <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto">
                        Explore techniques by assurance goals, categories, or model dependencies to find the right approach for your AI assurance needs.
                    </p>
                </section>

                {/* Assurance Goals Section */}
                <section className="space-y-8">
                    <h2 className="text-2xl font-bold">Assurance Goals</h2>

                    <Tabs defaultValue="Explainability" className="space-y-8" onValueChange={setSelectedGoal}>
                        <TabsList className="flex flex-wrap gap-2">
                            {!isLoadingGoals && assuranceGoalsData?.results && assuranceGoalsData.results.map((goal: AssuranceGoal) => (
                                <TabsTrigger
                                    key={goal.id}
                                    value={goal.name}
                                    className="flex items-center gap-2"
                                >
                                    <GoalIcon goalName={goal.name} size={16} />
                                    <span>{goal.name}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {!isLoadingGoals && assuranceGoalsData?.results && assuranceGoalsData.results.map((goal: AssuranceGoal) => (
                            <TabsContent key={goal.id} value={goal.name} className="space-y-6">
                                {/* Goal description */}
                                <div className="bg-muted/30 p-6 rounded-lg">
                                    <p className="text-lg">{goalDescriptions[goal.name] || goal.description}</p>
                                </div>

                                {/* Example techniques for this goal */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-semibold">Example {goal.name} Techniques</h3>

                                    {isLoadingTechniques ? (
                                        <p>Loading examples...</p>
                                    ) : goalTechniques?.results && goalTechniques.results.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {goalTechniques.results.slice(0, 3).map((technique: Technique) => (
                                                <Card key={technique.id} className="h-full flex flex-col">
                                                    <CardHeader>
                                                        <CardTitle className="line-clamp-2">{technique.name}</CardTitle>
                                                        <CardDescription>
                                                            {technique.model_dependency}
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="flex-grow">
                                                        <p className="line-clamp-4 text-sm">{technique.description}</p>
                                                    </CardContent>
                                                    <CardFooter>
                                                        <Button asChild variant="outline" size="sm" className="w-full">
                                                            <Link href={`/techniques/${technique.id}`}>
                                                                View Details
                                                            </Link>
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>No example techniques found for {goal.name}.</p>
                                    )}

                                    {/* Link to all techniques for this goal */}
                                    <div className="flex justify-center mt-6">
                                        <Button asChild size="lg">
                                            <Link href={createFilterUrl("assurance_goal", goal.name)}>
                                                Browse All {goal.name} Techniques
                                                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>

                                {/* Categories related to this goal */}
                                {categoriesByGoal[goal.name] && categoriesByGoal[goal.name].length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-semibold">{goal.name} Categories</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {categoriesByGoal[goal.name].map((category: Category) => (
                                                <Card key={category.id} className="hover:bg-muted/20 transition-colors">
                                                    <CardHeader>
                                                        <CardTitle>{category.name}</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="line-clamp-3 text-sm">{category.description || `${category.name} techniques for ${goal.name}`}</p>
                                                    </CardContent>
                                                    <CardFooter>
                                                        <Button asChild variant="outline" size="sm" className="w-full">
                                                            <Link href={createFilterUrl("category", category.id.toString())}>
                                                                Browse {category.name} Techniques
                                                            </Link>
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        ))}
                    </Tabs>
                </section>

                {/* Categories Section */}
                <section className="space-y-8">
                    <h2 className="text-2xl font-bold">Categories by Name</h2>

                    <div className="bg-muted/30 p-6 rounded-lg">
                        <p className="text-lg">
                            Categories provide a more granular classification of techniques within each assurance goal.
                            Use these to find specific approaches targeting particular aspects of AI systems.
                        </p>
                    </div>

                    <Tabs
                        defaultValue={categoryGroups[0] || "A"}
                        className="space-y-8"
                        onValueChange={setSelectedCategoryGroup}
                    >
                        <TabsList className="flex flex-wrap gap-1">
                            {categoryGroups.map((letter) => (
                                <TabsTrigger key={letter} value={letter}>
                                    {letter}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {categoryGroups.map((letter) => (
                            <TabsContent key={letter} value={letter} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {categoriesByFirstLetter[letter] && categoriesByFirstLetter[letter].map((category: Category) => (
                                        <Card key={category.id} className="h-full flex flex-col">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <GoalIcon goalName={category.assurance_goal_name} size={16} />
                                                    <span>{category.name}</span>
                                                </CardTitle>
                                                <CardDescription>{category.assurance_goal_name}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex-grow">
                                                <p className="text-sm line-clamp-3">{category.description || `${category.name} techniques for ${category.assurance_goal_name}`}</p>
                                            </CardContent>
                                            <CardFooter>
                                                <Button asChild variant="outline" size="sm" className="w-full">
                                                    <Link href={createFilterUrl("category", category.id.toString())}>
                                                        Browse {category.name} Techniques
                                                    </Link>
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>

                    <div className="flex justify-center mt-6">
                        <Button asChild size="lg" variant="outline">
                            <Link href="/techniques">
                                Browse All Techniques
                                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                            </Link>
                        </Button>
                    </div>
                </section>

                {/* Model Dependency Section */}
                <section className="space-y-8">
                    <h2 className="text-2xl font-bold">Model Dependency</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Model-Agnostic */}
                        <Card className="h-full flex flex-col">
                            <CardHeader>
                                <CardTitle>Model-Agnostic Techniques</CardTitle>
                                <CardDescription>
                                    Techniques that can be applied to any machine learning model, regardless of its internal structure.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <ul className="space-y-2">
                                    {agnosticTechniques?.results && agnosticTechniques.results.slice(0, 3).map((technique: Technique) => (
                                        <li key={technique.id}>
                                            <Link href={`/techniques/${technique.id}`} className="text-primary hover:underline">
                                                {technique.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button asChild variant="default" className="w-full">
                                    <Link href={createFilterUrl("model_dependency", "Model-Agnostic")}>
                                        Browse Model-Agnostic Techniques
                                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Model-Specific */}
                        <Card className="h-full flex flex-col">
                            <CardHeader>
                                <CardTitle>Model-Specific Techniques</CardTitle>
                                <CardDescription>
                                    Techniques that require access to a model&apos;s internal components, gradients, or specific architectures.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <ul className="space-y-2">
                                    {specificTechniques?.results && specificTechniques.results.slice(0, 3).map((technique: Technique) => (
                                        <li key={technique.id}>
                                            <Link href={`/techniques/${technique.id}`} className="text-primary hover:underline">
                                                {technique.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button asChild variant="default" className="w-full">
                                    <Link href={createFilterUrl("model_dependency", "Model-Specific")}>
                                        Browse Model-Specific Techniques
                                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </section>

                {/* How to Use This Information Section */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold">How to Use This Information</h2>

                    <div className="bg-card rounded-lg p-8 shadow-sm space-y-6">
                        <div className="max-w-3xl mx-auto space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold flex items-center">
                                    <ArrowRight className="mr-2 h-5 w-5 text-primary" />
                                    Identify Your Assurance Goals
                                </h3>
                                <p className="text-lg ml-7">
                                    Start by determining which aspects of AI trustworthiness are most important for your system—explainability, fairness, security, etc.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold flex items-center">
                                    <ArrowRight className="mr-2 h-5 w-5 text-primary" />
                                    Consider Your Model Type
                                </h3>
                                <p className="text-lg ml-7">
                                    Some techniques require access to model internals, while others work with any model as a black box. Choose based on your access level.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold flex items-center">
                                    <ArrowRight className="mr-2 h-5 w-5 text-primary" />
                                    Explore Categories in Depth
                                </h3>
                                <p className="text-lg ml-7">
                                    Within each assurance goal, different categories address specific aspects of the problem. Browse these to narrow your search.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold flex items-center">
                                    <ArrowRight className="mr-2 h-5 w-5 text-primary" />
                                    Evaluate Implementation Requirements
                                </h3>
                                <p className="text-lg ml-7">
                                    Each technique has different complexity and computational requirements. Consider your resources and constraints.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold flex items-center">
                                    <ArrowRight className="mr-2 h-5 w-5 text-primary" />
                                    Combine Multiple Techniques
                                </h3>
                                <p className="text-lg ml-7">
                                    Often, the best approach is to use multiple techniques together to address different aspects of AI assurance.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </MainLayout>
    );
}