// src/components/technique/TechniquesList.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
	useAssuranceGoals,
	calculateTotalPages,
	useTechniques,
	useCategories,
} from "@/lib/api/hooks";
import { useFilterParams } from "@/lib/hooks/useFilterParams";

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
import {
	Brain,
	Scale,
	Shield,
	ShieldCheck,
	CheckCircle,
	Eye,
	Info,
	Loader2,
	Lock,
} from "lucide-react";
import type { Technique, Category, AssuranceGoal } from "@/lib/types";

// Number of items per page - must match backend setting (20)
const PAGE_SIZE = 20;

// Initial filter values
const initialFilters = {
	search: "",
	assurance_goal: "all",
	category: "all",
};

// Extracted components
const TechniqueCard = ({
	technique,
}: {
	technique: Technique;
}): JSX.Element => {
	// Format function to improve display of category names
	const formatCategoryName = (name: string) => {
		return name
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	};

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

	// Map assurance goals to their respective icons
	const goalIcons = {
		Explainability: <Brain className="h-4 w-4" />,
		Fairness: <Scale className="h-4 w-4" />,
		Security: <Shield className="h-4 w-4" />,
		Safety: <ShieldCheck className="h-4 w-4" />,
		Reliability: <CheckCircle className="h-4 w-4" />,
		Transparency: <Eye className="h-4 w-4" />,
		Privacy: <Lock className="h-4 w-4" />,
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
							{goalIcons[goal.name as keyof typeof goalIcons] || (
								<Info className="h-4 w-4" />
							)}
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
	// Use custom filter hook to manage URL parameters
	const { filters, setFilter, currentPage } = useFilterParams(initialFilters);

	// Fetch data from API
	const {
		data: techniquesData,
		isLoading,
		error,
	} = useTechniques(
		{
			search: filters.search,
			assurance_goal: filters.assurance_goal,
			category: filters.category,
		},
		currentPage
	);

	// Fetch filtered categories based on selected assurance goal
	const { data: categoriesData } = useCategories(
		filters.assurance_goal !== "all"
			? parseInt(filters.assurance_goal)
			: undefined
	);
	const { data: assuranceGoalsData } = useAssuranceGoals();

	// Calculate pagination information
	const totalItems = techniquesData?.count || 0;
	const totalPages = calculateTotalPages(totalItems, PAGE_SIZE);

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
						value={filters.search || ""}
						onChange={(e) => {
							const newValue = e.target.value;
							if (newValue !== filters.search) {
								setFilter("search", newValue);
							}
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								// Build URL with current filters
								const params = new URLSearchParams();

								// Add search if provided
								if (filters.search) {
									params.set("search", filters.search);
								}

								// Add assurance goal if set
								if (
									filters.assurance_goal &&
									filters.assurance_goal !== "all"
								) {
									params.set(
										"assurance_goals",
										filters.assurance_goal
									);
								}

								// Add category if set
								if (
									filters.category &&
									filters.category !== "all"
								) {
									params.set("categories", filters.category);
								}

								// Always set page
								params.set("page", "1");

								// Navigate
								window.location.href = `/techniques?${params.toString()}`;
							}
						}}
					/>
					<Select
						value={filters.assurance_goal || "all"}
						onValueChange={(value) => {
							if (value === "all") {
								window.location.href = "/techniques?page=1";
							} else {
								window.location.href = `/techniques?assurance_goals=${value}&page=1`;
							}
						}}
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
					<Select
						value={filters.category || "all"}
						onValueChange={(value) => {
							const params = new URLSearchParams();

							// Add category filter if not "all"
							if (value !== "all") {
								params.set("categories", value);
							}

							// Add assurance goal filter if it's set
							if (
								filters.assurance_goal &&
								filters.assurance_goal !== "all"
							) {
								params.set(
									"assurance_goals",
									filters.assurance_goal
								);
							}

							// Always set page
							params.set("page", "1");

							// Navigate to filtered URL
							window.location.href = `/techniques?${params.toString()}`;
						}}
					>
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
						<Button
							onClick={() => {
								// Build URL with all current filters
								const params = new URLSearchParams();

								// Add search if provided
								if (filters.search) {
									params.set("search", filters.search);
								}

								// Add assurance goal if set
								if (
									filters.assurance_goal &&
									filters.assurance_goal !== "all"
								) {
									params.set(
										"assurance_goals",
										filters.assurance_goal
									);
								}

								// Add category if set
								if (
									filters.category &&
									filters.category !== "all"
								) {
									params.set("categories", filters.category);
								}

								params.set("page", "1");

								// Navigate to filtered URL
								window.location.href = `/techniques?${params.toString()}`;
							}}
						>
							Apply Filters
						</Button>
						<Button
							variant="outline"
							onClick={() => {
								// Direct navigation to reset
								window.location.href = "/techniques?page=1";
							}}
						>
							Reset
						</Button>
					</div>
				</div>
			</div>

			{isLoading ? (
				<div className="flex justify-center items-center py-8">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<span className="ml-2">Loading techniques...</span>
				</div>
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
									<TechniqueCard
										key={technique.id}
										technique={technique}
									/>
								))}
							</div>

							{/* Only show pagination if we have more than one page */}
							{totalPages > 1 && (
								<Pagination
									currentPage={currentPage}
									totalPages={totalPages}
									onPageChange={(newPage) => {
										// Build URL with current filters and new page
										const params = new URLSearchParams();

										// Add search if provided
										if (filters.search) {
											params.set(
												"search",
												filters.search
											);
										}

										// Add assurance goal if set
										if (
											filters.assurance_goal &&
											filters.assurance_goal !== "all"
										) {
											params.set(
												"assurance_goals",
												filters.assurance_goal
											);
										}

										// Add category if set
										if (
											filters.category &&
											filters.category !== "all"
										) {
											params.set(
												"categories",
												filters.category
											);
										}

										// Set the new page parameter
										params.set("page", newPage.toString());

										// Navigate to new page
										window.location.href = `/techniques?${params.toString()}`;
									}}
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
	);
}
