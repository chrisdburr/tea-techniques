"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
	useAssuranceGoals,
	calculateTotalPages,
	useTechniques,
	useCategories,
} from "@/lib/api/hooks";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import TechniquesSidebar, {
	FilterState,
} from "@/components/technique/TechniquesSidebar";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Loader2 } from "lucide-react";
import type { Technique } from "@/lib/types";
import { formatCategoryName } from "./CategoryTag";
import GoalIcon from "./GoalIcon";

// Number of items per page - must match backend setting (20)
const PAGE_SIZE = 20;

// Initial filter values
const initialFilters: FilterState = {
	search: "",
	assurance_goals: [],
	categories: [],
	model_dependency: [],
	complexity_max: 5,
	computational_cost_max: 5,
};

// Extracted TechniqueCard component
const TechniqueCard = ({
	technique,
}: {
	technique: Technique;
}): JSX.Element => {
	// Get first category and subcategory if available
	const primaryCategory =
		technique.categories.length > 0
			? formatCategoryName(technique.categories[0].name)
			: "Uncategorized";

	// Get subcategory if available
	const subcategory =
		technique.subcategories.length > 0
			? formatCategoryName(technique.subcategories[0].name)
			: null;

	// Truncate only subcategory if too long
	const truncateSubcategory = (text: string, maxLength = 20) => {
		if (!text || text.length <= maxLength) return text;
		return text.substring(0, maxLength) + "...";
	};

	// Build category display text with truncation only for subcategory
	const categoryText = subcategory
		? `${primaryCategory} | ${truncateSubcategory(subcategory)}`
		: primaryCategory;

	// Format the title to remove parenthetical content if it's too long
	const formatTitle = (title: string) => {
		// If the title is potentially too long (over ~35 chars), try to simplify it
		if (title.length > 35 && title.includes("(")) {
			// Return everything before the first parenthesis, trimmed
			return title.split("(")[0].trim();
		}
		return title;
	};

	// Truncate description for display and add ellipsis if needed
	const truncateDescription = (description: string, maxLength = 110) => {
		if (description.length <= maxLength) return description;

		// Find the last space before the maxLength to avoid cutting words
		let cutoff = description.lastIndexOf(" ", maxLength);
		if (cutoff === -1) cutoff = maxLength;

		return description.substring(0, cutoff) + "...";
	};

	// Build full category text for hover tooltip
	const fullCategoryText = subcategory
		? `${primaryCategory} | ${subcategory}`
		: primaryCategory;

	return (
		<Card className="h-full flex flex-col">
			<CardHeader className="pb-2">
				<CardTitle
					className="line-clamp-1 text-lg"
					title={technique.name}
				>
					{formatTitle(technique.name)}
				</CardTitle>
				<CardDescription
					className="text-sm text-muted-foreground line-clamp-1"
					title={fullCategoryText}
				>
					{categoryText}
				</CardDescription>
			</CardHeader>

			<CardContent className="pt-0 pb-0 flex-grow flex flex-col">
				<p
					className="text-sm text-foreground mb-4 h-10 overflow-hidden"
					title={technique.description}
				>
					{truncateDescription(technique.description)}
				</p>

				<div className="flex items-center gap-2 mt-auto">
					{technique.assurance_goals.map((goal) => (
						<div
							key={goal.id}
							className="p-1.5 rounded-full flex items-center bg-secondary"
							title={goal.name}
						>
							<GoalIcon goalName={goal.name} size={16} />
						</div>
					))}
				</div>
			</CardContent>

			<CardFooter className="pt-4">
				<Button asChild variant="default" className="w-full">
					<Link href={`/techniques/${technique.id}`}>
						View Details
					</Link>
				</Button>
			</CardFooter>
		</Card>
	);
};

// Define EmptyStateComponent
const EmptyStateComponent = (): JSX.Element => {
	return (
		<div className="text-center py-8">
			<p>No techniques found matching your criteria.</p>
			<p className="mt-2 text-sm text-muted-foreground">
				This could be because:
			</p>
			<ul className="list-disc list-inside mt-2 text-sm text-muted-foreground">
				<li>No techniques exist in the database yet</li>
				<li>The current filters exclude all techniques</li>
			</ul>
		</div>
	);
};

export default function TechniquesList() {
	// State for mobile sidebar
	const [isSidebarOpen, setSidebarOpen] = useState(false);

	// Use custom filter hook to manage URL parameters
	const { filters: urlFilters, currentPage } = useFilterParams({
		search: "",
		assurance_goal: "all",
		category: "all",
		model_dependency: "all",
	});

	// State for the new filter format
	const [filters, setFilters] = useState<FilterState>(() => {
		// Convert from URL format to our new format
		return {
			search: urlFilters.search || "",
			assurance_goals:
				urlFilters.assurance_goal !== "all"
					? [urlFilters.assurance_goal]
					: [],
			categories:
				urlFilters.category !== "all" ? [urlFilters.category] : [],
			model_dependency:
				urlFilters.model_dependency !== "all"
					? [urlFilters.model_dependency]
					: [],
			complexity_max: urlFilters.complexity_max
				? parseInt(urlFilters.complexity_max)
				: 5,
			computational_cost_max: urlFilters.computational_cost_max
				? parseInt(urlFilters.computational_cost_max)
				: 5,
		};
	});

	// Convert back to URL format for API calls
	const apiFilters = useMemo(() => {
		return {
			search: filters.search,
			search_fields: "name",
			assurance_goal:
				filters.assurance_goals.length === 1
					? filters.assurance_goals[0]
					: "all",
			category:
				filters.categories.length === 1 ? filters.categories[0] : "all",
			model_dependency:
				filters.model_dependency.length > 0
					? filters.model_dependency[0]
					: "all",
			complexity_max: filters.complexity_max?.toString(),
			computational_cost_max: filters.computational_cost_max?.toString(),
		};
	}, [filters]);

	// Fetch data from API
	const {
		data: techniquesData,
		isLoading,
		error,
	} = useTechniques(apiFilters, currentPage);

	// Fetch filtered categories based on selected assurance goal
	const { data: categoriesData, isLoading: isLoadingCategories } =
		useCategories(
			filters.assurance_goals.length === 1
				? parseInt(filters.assurance_goals[0])
				: undefined
		);
	const { data: assuranceGoalsData, isLoading: isLoadingGoals } =
		useAssuranceGoals();

	// Calculate pagination information
	const totalItems = techniquesData?.count || 0;
	const totalPages = calculateTotalPages(totalItems, PAGE_SIZE);

	// Update the techniques memo to include client-side filtering for complexity and computational cost
	const techniques = useMemo(() => {
		const results = techniquesData?.results || [];

		// Apply client-side filtering for results
		return results.filter((technique: Technique) => {
			// Filter by search term if needed
			if (filters.search && filters.search.trim() !== "") {
				const searchTerm = filters.search.toLowerCase().trim();
				if (!technique.name.toLowerCase().includes(searchTerm)) {
					return false;
				}
			}

			// Apply complexity_max filter
			if (
				filters.complexity_max !== undefined &&
				technique.complexity_rating !== undefined &&
				technique.complexity_rating > filters.complexity_max
			) {
				return false;
			}

			// Apply computational_cost_max filter
			if (
				filters.computational_cost_max !== undefined &&
				technique.computational_cost_rating !== undefined &&
				technique.computational_cost_rating >
					filters.computational_cost_max
			) {
				return false;
			}

			// If it passed all filters, include it
			return true;
		});
	}, [
		techniquesData?.results,
		filters.search,
		filters.complexity_max,
		filters.computational_cost_max,
	]);

	// Apply filters function
	const applyFilters = () => {
		// Build URL with current filters
		const params = new URLSearchParams();

		// Add search if provided
		if (filters.search) {
			params.set("search", filters.search);
			params.set("search_fields", "name");
		}

		// Add assurance goals if set (currently API only supports one)
		if (filters.assurance_goals.length > 0) {
			params.set("assurance_goals", filters.assurance_goals[0]);
		}

		// Add categories if set (currently API only supports one)
		if (filters.categories.length > 0) {
			params.set("categories", filters.categories[0]);
		}

		// Add model dependency if set (currently API only supports one)
		if (filters.model_dependency.length > 0) {
			params.set("model_dependency", filters.model_dependency[0]);
		}

		// Add max complexity if not at the default maximum
		if (filters.complexity_max && filters.complexity_max < 5) {
			params.set("complexity_max", filters.complexity_max.toString());
		}

		// Add max computational cost if not at the default maximum
		if (
			filters.computational_cost_max &&
			filters.computational_cost_max < 5
		) {
			params.set(
				"computational_cost_max",
				filters.computational_cost_max.toString()
			);
		}

		// Always set page to 1 when applying filters
		params.set("page", "1");

		// Navigate
		window.location.href = `/techniques?${params.toString()}`;
	};

	// Reset filters function
	const resetFilters = () => {
		setFilters(initialFilters);
		window.location.href = "/techniques?page=1";
	};

	// Page change handler function
	const handlePageChange = (newPage: number) => {
		// Build URL with current filters and new page
		const params = new URLSearchParams();

		// Add search if provided
		if (filters.search) {
			params.set("search", filters.search);
			params.set("search_fields", "name");
		}

		// Add assurance goals if set
		if (filters.assurance_goals.length > 0) {
			params.set("assurance_goals", filters.assurance_goals[0]);
		}

		// Add categories if set
		if (filters.categories.length > 0) {
			params.set("categories", filters.categories[0]);
		}

		// Add model dependency if set
		if (filters.model_dependency.length > 0) {
			params.set("model_dependency", filters.model_dependency[0]);
		}

		// Add max complexity if not at default
		if (filters.complexity_max && filters.complexity_max < 5) {
			params.set("complexity_max", filters.complexity_max.toString());
		}

		// Add max computational cost if not at default
		if (
			filters.computational_cost_max &&
			filters.computational_cost_max < 5
		) {
			params.set(
				"computational_cost_max",
				filters.computational_cost_max.toString()
			);
		}

		// Set the new page parameter
		params.set("page", newPage.toString());

		// Navigate to new page
		window.location.href = `/techniques?${params.toString()}`;
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Techniques</h1>
				<Button asChild>
					<Link href="/techniques/add">Add New Technique</Link>
				</Button>
			</div>

			{/* Main content with sidebar */}
			<div className="flex flex-col md:flex-row gap-6">
				{/* Sidebar */}
				<div className="md:w-80 shrink-0">
					<TechniquesSidebar
						filters={filters}
						setFilters={setFilters}
						applyFilters={applyFilters}
						resetFilters={resetFilters}
						assuranceGoals={assuranceGoalsData?.results}
						categories={categoriesData?.results}
						isDataLoading={isLoadingGoals || isLoadingCategories}
						isMobileOpen={isSidebarOpen}
						setIsMobileOpen={setSidebarOpen}
					/>
				</div>

				{/* Techniques list */}
				<div className="flex-1">
					{isLoading ? (
						<div className="flex justify-center items-center py-8">
							<Loader2 className="h-8 w-8 animate-spin text-primary" />
							<span className="ml-2">Loading techniques...</span>
						</div>
					) : error ? (
						<div className="text-center py-8 text-red-500">
							<p>
								Error loading techniques:{" "}
								{(error as Error).message}
							</p>
							<p className="mt-2">
								Please check that the backend is running and
								properly configured.
							</p>
						</div>
					) : (
						<>
							{techniques.length > 0 ? (
								<>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
										{techniques.map(
											(technique: Technique) => (
												<TechniqueCard
													key={technique.id}
													technique={technique}
												/>
											)
										)}
									</div>

									{/* Only show pagination if we have more than one page */}
									{totalPages > 1 && (
										<Pagination
											currentPage={currentPage}
											totalPages={totalPages}
											onPageChange={handlePageChange}
											className="mt-8"
										/>
									)}
								</>
							) : (
								<EmptyStateComponent />
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
