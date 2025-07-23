import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import GoalIcon from "@/components/technique/GoalIcon";

const categories = [
  {
    name: "Explainability",
    slug: "explainability",
    description:
      "Techniques that aim to make AI models more interpretable and their decisions more understandable to humans.",
  },
  {
    name: "Fairness",
    slug: "fairness",
    description:
      "Techniques that assess and mitigate bias in AI systems to ensure equitable outcomes across diverse demographic groups.",
  },
  {
    name: "Security",
    slug: "security",
    description:
      "Techniques that protect AI systems from adversarial attacks, vulnerabilities, and other security threats.",
  },
  {
    name: "Privacy",
    slug: "privacy",
    description:
      "Techniques that help preserve data privacy and confidentiality when developing or deploying AI systems.",
  },
  {
    name: "Reliability",
    slug: "reliability",
    description:
      "Techniques that ensure AI systems perform consistently and as expected across various conditions and environments.",
  },
  {
    name: "Safety",
    slug: "safety",
    description:
      "Techniques that prevent harm to humans, environments, and other systems from AI operations.",
  },
  {
    name: "Transparency",
    slug: "transparency",
    description:
      "Techniques that promote openness about how AI systems are developed, governed, and maintained.",
  },
];

export default function CategoriesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="space-y-4">
        <h1 className="text-3xl font-bold">TEA Technique Categories</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Explore techniques by assurance goals to find the right approach for
          your AI assurance needs. Each category focuses on specific aspects of
          trustworthy and ethical AI development.
        </p>
      </section>

      {/* Categories Grid */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Assurance Goal Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card
              key={category.slug}
              className="h-full flex flex-col hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <GoalIcon goalName={category.name} size={24} />
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  {category.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-end">
                <Button asChild className="w-full">
                  <Link href={`/categories/${category.slug}`}>
                    Explore {category.name} Techniques
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How to Use Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">How to Use These Categories</h2>
        <div className="bg-card rounded-lg p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center">
                  <ArrowRight className="mr-2 h-5 w-5 text-primary" />
                  Identify Your Primary Goals
                </h3>
                <p className="text-muted-foreground">
                  Start by determining which aspects of AI trustworthiness are
                  most important for your specific use case and regulatory
                  requirements.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center">
                  <ArrowRight className="mr-2 h-5 w-5 text-primary" />
                  Explore Multiple Categories
                </h3>
                <p className="text-muted-foreground">
                  Many AI systems benefit from techniques across multiple
                  categories. Consider how different assurance goals complement
                  each other.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center">
                  <ArrowRight className="mr-2 h-5 w-5 text-primary" />
                  Consider Implementation Context
                </h3>
                <p className="text-muted-foreground">
                  Each technique has different requirements for model access,
                  computational resources, and technical expertise.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center">
                  <ArrowRight className="mr-2 h-5 w-5 text-primary" />
                  Build Comprehensive Assurance
                </h3>
                <p className="text-muted-foreground">
                  The most robust AI systems often combine techniques from
                  multiple categories to address different aspects of
                  trustworthiness.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
