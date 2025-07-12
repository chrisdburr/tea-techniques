"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight } from "lucide-react";
import { useAssuranceGoals, useTechniques } from "@/lib/api/hooks";
import GoalIcon from "@/components/technique/GoalIcon";
import type { AssuranceGoal, Technique } from "@/lib/types";

export default function CategoriesPage() {
    // State for the selected tab and goal
    const [selectedGoal, setSelectedGoal] = useState<string>("Explainability");
    const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);


    // Fetch assurance goals
    const { data: assuranceGoalsData, isLoading: isLoadingGoals } = useAssuranceGoals();


    // Fetch ALL techniques (not filtered by goal) to allow client-side filtering
    const { data: allTechniques, isLoading: isLoadingTechniques } = useTechniques(
        {}, // No filters - get all techniques
        1 // First page only
    );

    useEffect(() => {
        if (assuranceGoalsData?.results) {
            const goal = assuranceGoalsData.results.find(g => g.name === selectedGoal);
            if (goal) {
                setSelectedGoalId(goal.id);
            }
        }
    }, [selectedGoal, assuranceGoalsData]);

    // Client-side filter for the selected goal
    const goalTechniques = React.useMemo(() => {
        // Ensure we have a properly typed return value for empty case
        if (!allTechniques) return { results: [] as Technique[] };
        
        // Check if results exist in a type-safe way
        const techniquesData = allTechniques as unknown as { results: Technique[] };
        if (!techniquesData.results || !Array.isArray(techniquesData.results)) {
            return { results: [] as Technique[] };
        }

        console.log(`Filtering techniques for goal: ${selectedGoal}`);

        // Log the first technique's full structure to examine how assurance_goals are represented
        if (techniquesData.results.length > 0) {
            console.log("First technique structure:", JSON.stringify(techniquesData.results[0], null, 2));
            console.log("First technique goals:", techniquesData.results[0].assurance_goals);
        }

        // Filter techniques to only include those with the selected goal
        const filteredResults = techniquesData.results.filter((technique: Technique) => {
            // Log each technique's goals for the first few techniques
            if (techniquesData.results.indexOf(technique) < 3) {
                console.log(`Technique ${technique.slug} (${technique.name}) goals:`,
                    technique.assurance_goals.map(g => g.name));
            }

            const hasMatchingGoal = technique.assurance_goals &&
                Array.isArray(technique.assurance_goals) &&
                technique.assurance_goals.some(goal => {
                    // This is the key check - is the name matching?
                    const matches = goal && typeof goal === 'object' && goal.name === selectedGoal;
                    return matches;
                });

            return hasMatchingGoal;
        });

        console.log(`Found ${filteredResults.length} techniques for ${selectedGoal}`);
        return {
            ...techniquesData,
            results: filteredResults
        };
    }, [allTechniques, selectedGoal]);

    // Fetch example techniques by complexity rating
    // const { data: simpleTechniques } = useTechniques(
    //     { complexity_max: "2" },
    //     1
    // );

    // const { data: complexTechniques } = useTechniques(
    //     { complexity_min: "4" },
    //     1
    // );

    // Detailed descriptions for each assurance goal
    const goalDescriptions: Record<string, string> = {
        Explainability: "Techniques that aim to make AI models more interpretable and their decisions more understandable to humans. These techniques help identify how models transform inputs into outputs, which features are most important for predictions, and why specific decisions are made.",
        Fairness: "Techniques that assess and mitigate bias in AI systems to ensure equitable outcomes across diverse demographic groups. These approaches help identify, measure, and reduce discrimination and unfairness in algorithmic decision-making.",
        Security: "Techniques that protect AI systems from adversarial attacks, vulnerabilities, and other security threats. These methods enhance the robustness of AI systems against manipulation and unauthorized exploitation.",
        Privacy: "Techniques that help preserve data privacy and confidentiality when developing or deploying AI systems. These approaches enable machine learning while protecting sensitive information from exposure or inference.",
        Reliability: "Techniques that ensure AI systems perform consistently and as expected across various conditions and environments. These methods improve robustness, error detection, and failure prevention in AI applications.",
        Safety: "Techniques that prevent harm to humans, environments, and other systems from AI operations. These approaches focus on identifying and mitigating potential risks, ensuring AI systems operate within safe boundaries and prevent unintended consequences.",
        Transparency: "Techniques that promote openness about how AI systems are developed, governed, and maintained. These approaches focus on documenting project governance, decision-making processes, and development methodologies to build trust and enable effective oversight."
    };


    // Helper function to create URL with correct filter parameters
    const createFilterUrl = (filterType: string, filterValue: string | number) => {
        // For assurance goals, generate URL with goal ID
        if (filterType === "assurance_goal" && selectedGoalId) {
            return `/techniques?assurance_goals=${selectedGoalId}`;
        }
        if (filterType === "tag") {
            return `/techniques?tags=${encodeURIComponent(filterValue.toString())}`;
        }
        // For other filters, use the exact parameter name
        return `/techniques?${filterType}=${encodeURIComponent(filterValue.toString())}`;
    };

    // Update the selected goal when tab changes
    useEffect(() => {
        if (selectedGoal && selectedGoal !== "all") {
            // You could make other adjustments here if needed
        }
    }, [selectedGoal]);

    // Add this function above your component
    const createPlaceholderTechniques = (goalName: string) => {
        return [
            {
                slug: `example-${goalName.toLowerCase().replace(/\s+/g, '-')}-technique-1`,
                name: `Example ${goalName} Technique 1`,
                description: `This is a placeholder example for ${goalName}. In a production environment, this would be an actual technique from the database.`,
                complexity_rating: 3,
                computational_cost_rating: 2,
                assurance_goals: [{ id: 0, name: goalName, description: '' }],
                tags: [],
                related_techniques: [],
                resources: [],
                example_use_cases: [],
                limitations: []
            },
            {
                slug: `example-${goalName.toLowerCase().replace(/\s+/g, '-')}-technique-2`,
                name: `Example ${goalName} Technique 2`,
                description: `Another placeholder example for ${goalName}. Add real techniques through the admin interface.`,
                complexity_rating: 4,
                computational_cost_rating: 3,
                assurance_goals: [{ id: 0, name: goalName, description: '' }],
                tags: [],
                related_techniques: [],
                resources: [],
                example_use_cases: [],
                limitations: []
            },
            {
                id: 3000 + Math.random() * 1000,
                name: `Example ${goalName} Technique 3`,
                description: `Third placeholder example for ${goalName}. In the future, this would contain real techniques from the database.`,
                complexity_rating: 2,
                computational_cost_rating: 1,
                assurance_goals: [{ id: 0, name: goalName, description: '' }],
                tags: [],
                related_techniques: [],
                resources: [],
                example_use_cases: [],
                limitations: []
            }
        ] as Technique[];
    };

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

                    <Tabs
                        defaultValue="Explainability"
                        className="space-y-8"
                        onValueChange={(value) => {
                            console.log("Tab changed to:", value);
                            setSelectedGoal(value);
                        }}
                    >
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
                                                <Card key={technique.slug} className="h-full flex flex-col">
                                                    <CardHeader>
                                                        <CardTitle className="line-clamp-2">{technique.name}</CardTitle>
                                                        <CardDescription>
                                                            Complexity: {technique.complexity_rating || 'N/A'}
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="flex-grow">
                                                        <p className="line-clamp-4 text-sm">{technique.description}</p>
                                                    </CardContent>
                                                    <CardFooter>
                                                        <Button asChild variant="outline" size="sm" className="w-full">
                                                            <Link href={`/techniques/${technique.slug}`}>
                                                                View Details
                                                            </Link>
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {createPlaceholderTechniques(selectedGoal).map((technique: Technique) => (
                                                <Card key={technique.slug} className="h-full flex flex-col">
                                                    <CardHeader>
                                                        <CardTitle className="line-clamp-2">{technique.name}</CardTitle>
                                                        <CardDescription>
                                                            Complexity: {technique.complexity_rating || 'N/A'}
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="flex-grow">
                                                        <p className="line-clamp-4 text-sm">{technique.description}</p>
                                                    </CardContent>
                                                    <CardFooter>
                                                        <Button asChild variant="outline" size="sm" className="w-full">
                                                            <Link href="/techniques">
                                                                View Similar Techniques
                                                            </Link>
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            ))}
                                        </div>
                                    )}


                                    {/* Link to all techniques for this goal */}
                                    <div className="flex justify-center mt-6">
                                        <Button asChild size="lg">
                                            <Link href={createFilterUrl("assurance_goal", selectedGoal)}>
                                                Browse All {selectedGoal} Techniques
                                                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>

                            </TabsContent>
                        ))}
                    </Tabs>
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
            </div >
        </MainLayout >
    );
}