"use client";

import { useState } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { useAssuranceGoals, useCategories } from "@/lib/api/hooks";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssuranceGoal, Category } from "@/lib/types";

export default function CategoriesPage() {
	// Removed unused router
	const { data: assuranceGoalsData, isLoading: isLoadingGoals } =
		useAssuranceGoals();
	const { data: categoriesData, isLoading: isLoadingCategories } =
		useCategories();
	const [, setActiveTab] = useState<string>("all");

	// Function to filter categories by assurance goal
	const getCategoriesByGoal = (goalId: number) => {
		return (
			categoriesData?.results?.filter(
				(category) => category.assurance_goal === goalId
			) || []
		);
	};

	// Function to get all unique assurance goals from categories
	const getUniqueAssuranceGoals = (): AssuranceGoal[] => {
		return assuranceGoalsData?.results || [];
	};

	const handleTabChange = (value: string) => {
		setActiveTab(value);
	};

	if (isLoadingGoals || isLoadingCategories) {
		return (
			<MainLayout>
				<div className="flex justify-center items-center py-20">
					<p className="text-muted-foreground">
						Loading categories...
					</p>
				</div>
			</MainLayout>
		);
	}

	const goals = getUniqueAssuranceGoals();

	return (
		<MainLayout>
			<div className="space-y-6">
				<div className="flex flex-col gap-2">
					<h1 className="text-3xl font-bold">Categories</h1>
					<p className="text-muted-foreground">
						Browse categories organized by assurance goals to find
						relevant techniques for your AI development process.
					</p>
				</div>

				<Tabs
					defaultValue="all"
					onValueChange={handleTabChange}
					className="w-full"
				>
					<TabsList className="mb-8">
						<TabsTrigger value="all">All Categories</TabsTrigger>
						{goals.map((goal) => (
							<TabsTrigger
								key={goal.id}
								value={goal.id.toString()}
							>
								{goal.name}
							</TabsTrigger>
						))}
					</TabsList>

					<TabsContent value="all" className="space-y-8">
						{goals.map((goal) => (
							<div key={goal.id} className="space-y-4">
								<h2 className="text-2xl font-semibold">
									{goal.name}
								</h2>
								<p className="text-muted-foreground mb-4">
									{goal.description}
								</p>

								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
									{getCategoriesByGoal(goal.id).map(
										(category) => (
											<CategoryCard
												key={category.id}
												category={category}
											/>
										)
									)}
								</div>
							</div>
						))}
					</TabsContent>

					{goals.map((goal) => (
						<TabsContent
							key={goal.id}
							value={goal.id.toString()}
							className="space-y-6"
						>
							<h2 className="text-2xl font-semibold">
								{goal.name}
							</h2>
							<p className="text-muted-foreground mb-4">
								{goal.description}
							</p>

							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{getCategoriesByGoal(goal.id).map(
									(category) => (
										<CategoryCard
											key={category.id}
											category={category}
										/>
									)
								)}
							</div>
						</TabsContent>
					))}
				</Tabs>
			</div>
		</MainLayout>
	);
}

interface CategoryCardProps {
	category: Category;
}

function CategoryCard({ category }: CategoryCardProps) {
	return (
		<Card className="h-full flex flex-col">
			<CardHeader>
				<CardTitle>{category.name}</CardTitle>
				<CardDescription>
					{category.assurance_goal_name}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex-grow">
				<p className="text-sm text-muted-foreground line-clamp-4">
					{category.description}
				</p>
			</CardContent>
			<CardFooter>
				<Button asChild variant="outline" className="w-full">
					<Link href={`/techniques?category=${category.id}`}>
						View Techniques
					</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}
