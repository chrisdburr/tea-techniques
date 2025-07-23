"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useTechniques } from "@/lib/api/hooks";
import GoalIcon from "@/components/technique/GoalIcon";
import type { Technique } from "@/lib/types";

interface CategoryPageTemplateProps {
  goalName: string;
  goalDescription: string;
}

export function CategoryPageTemplate({
  goalName,
  goalDescription,
}: CategoryPageTemplateProps) {
  // Fetch ALL techniques to allow client-side filtering
  const { data: allTechniques, isLoading: isLoadingTechniques } = useTechniques(
    {}, // No filters - get all techniques
    1, // First page only
  );

  // Client-side filter for the selected goal
  const goalTechniques = React.useMemo(() => {
    if (!allTechniques) return { results: [] as Technique[] };

    const techniquesData = allTechniques as unknown as { results: Technique[] };
    if (!techniquesData.results || !Array.isArray(techniquesData.results)) {
      return { results: [] as Technique[] };
    }

    // Filter techniques to only include those with the selected goal
    const filteredResults = techniquesData.results.filter(
      (technique: Technique) => {
        const hasMatchingGoal =
          technique.assurance_goals &&
          Array.isArray(technique.assurance_goals) &&
          technique.assurance_goals.some((goal) => {
            return goal && typeof goal === "object" && goal.name === goalName;
          });
        return hasMatchingGoal;
      },
    );

    return {
      ...techniquesData,
      results: filteredResults,
    };
  }, [allTechniques, goalName]);

  // Create placeholder techniques if no real ones exist
  const createPlaceholderTechniques = (goalName: string) => {
    return [
      {
        slug: `example-${goalName
          .toLowerCase()
          .replace(/\s+/g, "-")}-technique-1`,
        name: `Example ${goalName} Technique 1`,
        description: `This is a placeholder example for ${goalName}. In a production environment, this would be an actual technique from the database.`,
        complexity_rating: 3,
        computational_cost_rating: 2,
        assurance_goals: [{ id: 0, name: goalName, description: "" }],
        tags: [],
        related_techniques: [],
        resources: [],
        example_use_cases: [],
        limitations: [],
      },
      {
        slug: `example-${goalName
          .toLowerCase()
          .replace(/\s+/g, "-")}-technique-2`,
        name: `Example ${goalName} Technique 2`,
        description: `Another placeholder example for ${goalName}. Add real techniques through the admin interface.`,
        complexity_rating: 4,
        computational_cost_rating: 3,
        assurance_goals: [{ id: 0, name: goalName, description: "" }],
        tags: [],
        related_techniques: [],
        resources: [],
        example_use_cases: [],
        limitations: [],
      },
      {
        slug: `example-${goalName
          .toLowerCase()
          .replace(/\s+/g, "-")}-technique-3`,
        name: `Example ${goalName} Technique 3`,
        description: `Third placeholder example for ${goalName}. In the future, this would contain real techniques from the database.`,
        complexity_rating: 2,
        computational_cost_rating: 1,
        assurance_goals: [{ id: 0, name: goalName, description: "" }],
        tags: [],
        related_techniques: [],
        resources: [],
        example_use_cases: [],
        limitations: [],
      },
    ] as Technique[];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <GoalIcon goalName={goalName} size={32} />
          <h1 className="text-3xl font-bold">{goalName} Techniques</h1>
        </div>
        <div className="bg-muted/30 p-6 rounded-lg">
          <p className="text-lg">{goalDescription}</p>
        </div>
      </section>

      {/* Featured Techniques */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">
          Featured {goalName} Techniques
        </h2>

        {isLoadingTechniques ? (
          <p>Loading featured techniques...</p>
        ) : goalTechniques?.results && goalTechniques.results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goalTechniques.results
              .slice(0, 6) // Show only first 6 techniques
              .map((technique: Technique) => (
                <Card key={technique.slug} className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">
                      {technique.name}
                    </CardTitle>
                    <CardDescription>
                      Complexity: {technique.complexity_rating || "N/A"} |
                      Computational Cost:{" "}
                      {technique.computational_cost_rating || "N/A"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="line-clamp-4 text-sm">
                      {technique.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
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
            {createPlaceholderTechniques(goalName)
              .slice(0, 3) // Show only 3 placeholder techniques
              .map((technique: Technique) => (
                <Card key={technique.slug} className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">
                      {technique.name}
                    </CardTitle>
                    <CardDescription>
                      Complexity: {technique.complexity_rating || "N/A"} |
                      Computational Cost:{" "}
                      {technique.computational_cost_rating || "N/A"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="line-clamp-4 text-sm">
                      {technique.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Link href="/techniques">View Similar Techniques</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        )}

        {/* Link to browse all techniques with this goal */}
        <div className="flex justify-center mt-8">
          <Button asChild size="lg">
            <Link href={`/techniques?assurance_goals=${goalName}`}>
              Browse All {goalName} Techniques
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
