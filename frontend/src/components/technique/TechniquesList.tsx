// src/components/technique/TechniquesList.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
	useAssuranceGoals,
	calculateTotalPages,
	useTechniques,
	useCategoriesByAssuranceGoal
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
import { Pagination } from "@/components/ui/pagination";
import type { Technique, Category, AssuranceGoal } from "@/lib/types";

// Number of items per page - must match backend setting (20)
const PAGE_SIZE = 20;

export default function TechniquesList() {
	const searchParams = useSearchParams();
	const router = useRouter();

	// Get filter values from URL parameters
	const initialSearch = searchParams.get("search") || "";
	const initialAssuranceGoal = searchParams.get("assurance_goal") || "all";
	const initialCategory = searchParams.get("category") || "all";
	const initialPage = parseInt(searchParams.get("page") || "1", 10);

	// Local state for filters - initialize from URL params
	const [search, setSearch] = useState(initialSearch);
	const [assuranceGoal, setAssuranceGoal] = useState(initialAssuranceGoal);
	const [category, setCategory] = useState(initialCategory);
	const [currentPage, setCurrentPage] = useState(initialPage);

	// Reset URL parameters when component is mounted
	useEffect(() => {
		// Update local state from URL parameters on component mount or URL change
		setSearch(initialSearch);
		setAssuranceGoal(initialAssuranceGoal);
		setCategory(initialCategory);
		setCurrentPage(initialPage);
	}, [initialSearch, initialAssuranceGoal, initialCategory, initialPage]);

	// Reset category when assurance goal changes
	useEffect(() => {
		if (assuranceGoal !== initialAssuranceGoal) {
			setCategory("all");
		}
	}, [assuranceGoal, initialAssuranceGoal]);

	// Fetch data from API
	const { data: techniquesData, isLoading, error } = useTechniques(
		{
			search: initialSearch,
			assurance_goal: initialAssuranceGoal,
			category: initialCategory,
		},
		currentPage
	);

	// Fetch filtered categories based on selected assurance goal
	const { data: categoriesData } = useCategoriesByAssuranceGoal(assuranceGoal);
	const { data: assuranceGoalsData } = useAssuranceGoals();

	// Calculate pagination information
	const totalItems = techniquesData?.count || 0;
	const totalPages = calculateTotalPages(totalItems, PAGE_SIZE);
	
	// Debug logging in development
	if (process.env.NODE_ENV === "development") {
		console.log("Pagination info:", {
			totalItems,
			totalPages,
			currentPage,
			next: techniquesData?.next,
			previous: techniquesData?.previous,
		});
	}

	// Apply filters and update URL
	const applyFilters = () => {
		const params = new URLSearchParams();
		
		// Only add non-empty parameters
		if (search) params.set("search", search);
		if (assuranceGoal !== "all") params.set("assurance_goal", assuranceGoal);
		if (category !== "all") params.set("category", category);
		
		// Always reset to first page when applying new filters
		params.set("page", "1");
		
		// Navigate to updated URL
		router.push(`/techniques?${params.toString()}`);
	};

	// Reset all filters
	const resetFilters = () => {
		setSearch("");
		setAssuranceGoal("all");
		setCategory("all");
		router.push("/techniques?page=1");
	};

	// Handle page change
	const handlePageChange = (page: number) => {
		// Safety check for reasonable page bounds
		if (page < 1 || (totalPages > 0 && page > totalPages)) {
			console.warn(`Attempted to access invalid page ${page}. Total pages: ${totalPages}`);
			return;
		}

		// Build URL with current filters plus new page
		const params = new URLSearchParams();
		
		// Preserve all current filter values
		if (initialSearch) params.set("search", initialSearch);
		if (initialAssuranceGoal !== "all") params.set("assurance_goal", initialAssuranceGoal);
		if (initialCategory !== "all") params.set("category", initialCategory);
		
		// Set the new page parameter
		params.set("page", page.toString());
		
		// Navigate to new URL
		router.push(`/techniques?${params.toString()}`);
	};

	// Access techniques data safely
	const techniques = techniquesData?.results || [];

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
			) : error ? (
				<div className="text-center py-8 text-red-500">
					<p>Error loading techniques: {(error as Error).message}</p>
					<p className="mt-2">
						Please check that the backend is running and properly
						configured.
					</p>
				</div>
			) : (
				<>
					{techniques.length > 0 ? (
						<>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{techniques.map((technique: Technique) => (
									<Card key={technique.id}>
										<CardHeader>
											<CardTitle>
												{technique.name}
											</CardTitle>
											<CardDescription>
												{technique.category_name ||
													"Uncategorized"}{" "}
												| {technique.model_dependency}
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
								))}
							</div>

							{/* Only show pagination if we have more than one page */}
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								onPageChange={handlePageChange}
								className="mt-8"
							/>
						</>
					) : (
						<div className="text-center py-8">
							<p>No techniques found matching your criteria.</p>
							<p className="mt-2 text-sm text-muted-foreground">
								This could be because:
							</p>
							<ul className="list-disc list-inside mt-2 text-sm text-muted-foreground">
								<li>No techniques exist in the database yet</li>
								<li>
									The current filters exclude all techniques
								</li>
							</ul>
						</div>
					)}
				</>
			)}
		</div>
	);
}