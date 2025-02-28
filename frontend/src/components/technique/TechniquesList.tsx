// src/components/technique/TechniquesList.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
	useTechniques,
	useCategories,
	useAssuranceGoals,
} from "@/lib/api/hooks";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Technique, Category, AssuranceGoal } from "@/lib/types";

export default function TechniquesList() {
	const searchParams = useSearchParams();
	const router = useRouter();

	// Get filter values from URL parameters
	const initialSearch = searchParams.get("search") || "";
	const initialAssuranceGoal = searchParams.get("assurance_goal") || "all";
	const initialCategory = searchParams.get("category") || "all";

	// Local state for filters
	const [search, setSearch] = useState(initialSearch);
	const [assuranceGoal, setAssuranceGoal] = useState(initialAssuranceGoal);
	const [category, setCategory] = useState(initialCategory);

	// Queries
	const { data: techniquesData, isLoading } = useTechniques({
		search: initialSearch,
		assurance_goal: initialAssuranceGoal,
		category: initialCategory,
	});

	const { data: categoriesData } = useCategories();
	const { data: assuranceGoalsData } = useAssuranceGoals();

	// Apply filters
	const applyFilters = () => {
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (assuranceGoal !== "all")
			params.set("assurance_goal", assuranceGoal);
		if (category !== "all") params.set("category", category);
		router.push(`/techniques?${params.toString()}`);
	};

	// Reset filters
	const resetFilters = () => {
		setSearch("");
		setAssuranceGoal("all");
		setCategory("all");
		router.push("/techniques");
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Techniques</h1>
				<Button asChild>
					<Link href="/techniques/add">Add New Technique</Link>
				</Button>
			</div>

			<div className="bg-muted/30 p-4 rounded-lg">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Input
						placeholder="Search techniques..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && applyFilters()}
					/>
					<Select
						value={assuranceGoal}
						onValueChange={setAssuranceGoal}
					>
						<SelectTrigger>
							<SelectValue placeholder="Assurance Goal" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								All Assurance Goals
							</SelectItem>
							{assuranceGoalsData?.results?.map(
								(goal: AssuranceGoal) => (
									<SelectItem
										key={goal.id}
										value={goal.id.toString()}
									>
										{goal.name}
									</SelectItem>
								)
							)}
						</SelectContent>
					</Select>
					<Select value={category} onValueChange={setCategory}>
						<SelectTrigger>
							<SelectValue placeholder="Category" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Categories</SelectItem>
							{categoriesData?.results?.map((cat: Category) => (
								<SelectItem
									key={cat.id}
									value={cat.id.toString()}
								>
									{cat.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<div className="flex gap-2">
						<Button onClick={applyFilters}>Apply Filters</Button>
						<Button variant="outline" onClick={resetFilters}>
							Reset
						</Button>
					</div>
				</div>
			</div>

			{isLoading ? (
				<div className="text-center py-8">Loading techniques...</div>
			) : (
				<>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{techniquesData?.results?.map(
							(technique: Technique) => (
								<Card key={technique.id}>
									<CardHeader>
										<CardTitle>{technique.name}</CardTitle>
										<CardDescription>
											{technique.category_name} |{" "}
											{technique.model_dependency}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<p className="line-clamp-3 text-sm text-muted-foreground">
											{technique.description}
										</p>
									</CardContent>
									<CardFooter>
										<Button asChild variant="outline">
											<Link
												href={`/techniques/${technique.id}`}
											>
												View Details
											</Link>
										</Button>
									</CardFooter>
								</Card>
							)
						)}
					</div>

					{techniquesData?.results?.length === 0 && (
						<div className="text-center py-8">
							<p>No techniques found matching your criteria.</p>
						</div>
					)}
				</>
			)}
		</div>
	);
}
