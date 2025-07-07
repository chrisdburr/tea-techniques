// TechniquesList.tsx with pagination fix
"use client";

import React, {
	useState,
	useEffect,
	useMemo,
	useTransition,
	useCallback,
} from "react";
import Link from "next/link";
import {
	useAssuranceGoals,
	useTags,
	calculateTotalPages,
	useTechniques,
} from "@/lib/api/hooks";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import TechniquesSidebar, {
	FilterState,
} from "@/components/technique/TechniquesSidebar";
import TechniqueCard from "@/components/technique/TechniqueCard";

import { Pagination } from "@/components/ui/pagination";
import { Loader2, Filter } from "lucide-react";
import type { Technique } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// Number of items per page - must match backend setting (20)
const PAGE_SIZE = 20;

// Default filter values structure
// Used for reference when resetting filters


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
	// State for sidebar visibility (used for both mobile and desktop)
	const [isSidebarOpen, setSidebarOpen] = useState(true);

	// Detect screen size to automatically hide sidebar on mobile
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 768) {
				setSidebarOpen(false);
			} else {
				setSidebarOpen(true);
			}
		};

		// Initial check
		handleResize();

		// Listen for window resize events
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Get current URL parameters directly
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const [, startTransition] = useTransition();
	
	// Still use the hook for currentPage - it provides other useful functionality
	const { currentPage } = useFilterParams({
		search: "",
		assurance_goal: "all",
		tags: "",
	});

	// Parse filters from URL with useCallback to prevent recreating on each render
	const getInitialFilters = useCallback(() => {
		const initialFilters: FilterState = {
			search: "",
			assurance_goals: [],
			tags: [],
			complexity_max: 5,
			computational_cost_max: 5,
		};

		// Get search from URL
		const searchParam = searchParams.get("search");
		if (searchParam) {
			initialFilters.search = searchParam;
		}

		// Get multiple assurance_goals from URL
		// This is the key fix - using getAll() instead of get() for array parameters
		const assuranceGoalParams = searchParams.getAll("assurance_goals");
		if (assuranceGoalParams.length > 0) {
			console.log("Found assurance_goals in URL:", assuranceGoalParams);
			initialFilters.assurance_goals = assuranceGoalParams;
		}

		// Get multiple tags from URL
		const tagParams = searchParams.getAll("tags");
		if (tagParams.length > 0) {
			console.log("Found tags in URL:", tagParams);
			initialFilters.tags = tagParams;
		}

		// Get rating filters
		const complexityParam = searchParams.get("complexity_max");
		if (complexityParam) {
			initialFilters.complexity_max = parseInt(complexityParam, 10);
		}

		const compCostParam = searchParams.get("computational_cost_max");
		if (compCostParam) {
			initialFilters.computational_cost_max = parseInt(compCostParam, 10);
		}

		console.log("Initialized filters from URL:", initialFilters);
		return initialFilters;
	}, [searchParams]);
	
	// State for the filters being edited by the user (not yet applied)
	const [filters, setFilters] = useState<FilterState>(getInitialFilters);
	
	// State for the filters that have been applied (used for API calls)
	const [appliedFilters, setAppliedFilters] = useState<FilterState>(getInitialFilters);
	
	// Update filters when URL parameters change
	useEffect(() => {
		// Get filters from URL parameters
		const updatedFilters = getInitialFilters();
		setFilters(updatedFilters);
		setAppliedFilters(updatedFilters);
	}, [searchParams, getInitialFilters]);

	// Convert back to URL format for API calls - but using appliedFilters not filters
	const apiFilters = useMemo(() => {
		return {
			search: appliedFilters.search,
			search_fields: "name",
			// Pass all assurance goals, not just the first one
			assurance_goals:
				appliedFilters.assurance_goals.length > 0
					? appliedFilters.assurance_goals
					: undefined,
			tags:
				appliedFilters.tags.length > 0
					? appliedFilters.tags
					: undefined,
			complexity_max: appliedFilters.complexity_max?.toString(),
			computational_cost_max: appliedFilters.computational_cost_max?.toString(),
		};
	}, [appliedFilters]);

	// Fetch data from API
	const {
		data: techniquesData,
		isLoading,
		error,
	} = useTechniques(apiFilters, currentPage);

	// Fetch tags and assurance goals for sidebar
	const { data: tagsData, isLoading: isLoadingTags } = useTags();
	const { data: assuranceGoalsData, isLoading: isLoadingGoals } =
		useAssuranceGoals();

	// Update the techniques memo to include client-side filtering for complexity and computational cost
	const techniques = useMemo(() => {
		// Type assertion to ensure TypeScript knows the structure
		const data = techniquesData as { results?: Technique[] } | undefined;
		const results = data?.results || [];

		// Apply client-side filtering for results using appliedFilters
		return results.filter((technique: Technique) => {
			// Filter by search term if needed
			if (appliedFilters.search && appliedFilters.search.trim() !== "") {
				const searchTerm = appliedFilters.search.toLowerCase().trim();
				if (!technique.name.toLowerCase().includes(searchTerm)) {
					return false;
				}
			}

			// Apply complexity_max filter
			if (
				appliedFilters.complexity_max !== undefined &&
				technique.complexity_rating !== undefined &&
				technique.complexity_rating > appliedFilters.complexity_max
			) {
				return false;
			}

			// Apply computational_cost_max filter
			if (
				appliedFilters.computational_cost_max !== undefined &&
				technique.computational_cost_rating !== undefined &&
				technique.computational_cost_rating >
					appliedFilters.computational_cost_max
			) {
				return false;
			}

			// If it passed all filters, include it
			return true;
		});
	}, [
		techniquesData,
		appliedFilters.search,
		appliedFilters.complexity_max,
		appliedFilters.computational_cost_max,
	]);

	// Calculate pagination information using the total count from the API response
	// Get the total count from the API response
	const apiTotalCount = (techniquesData as { count?: number })?.count || 0;
	const totalPages = calculateTotalPages(apiTotalCount, PAGE_SIZE);

	// Apply filters function
	const applyFilters = useCallback((explicitFilters?: FilterState) => {
		// Use explicitly passed filters or current state
		const filtersToApply = explicitFilters || filters;
		console.log("🔍 ApplyFilters EXPLICITLY called with:", filtersToApply);
		
		// Update appliedFilters state first - this triggers API refresh
		setAppliedFilters(filtersToApply);

		// Build URL with current filters
		const params = new URLSearchParams();

		// Add search if provided
		if (filtersToApply.search) {
			params.set("search", filtersToApply.search);
			params.set("search_fields", "name");
		}

		// Add assurance goals - each as a separate parameter
		if (filtersToApply.assurance_goals.length > 0) {
			console.log(
				"Adding assurance goals to URL:",
				filtersToApply.assurance_goals
			);
			// Important: Use "append" for each goal ID
			filtersToApply.assurance_goals.forEach((goalId) => {
				params.append("assurance_goals", goalId);
			});
		}

		// Add tags - each as a separate parameter
		if (filtersToApply.tags.length > 0) {
			console.log("Adding tags to URL:", filtersToApply.tags);
			filtersToApply.tags.forEach((tagId) => {
				params.append("tags", tagId);
			});
		}

		// Add complexity and computational cost
		if (
			filtersToApply.complexity_max !== undefined &&
			filtersToApply.complexity_max < 5
		) {
			params.set(
				"complexity_max",
				filtersToApply.complexity_max.toString()
			);
		}

		if (
			filtersToApply.computational_cost_max !== undefined &&
			filtersToApply.computational_cost_max < 5
		) {
			params.set(
				"computational_cost_max",
				filtersToApply.computational_cost_max.toString()
			);
		}

		// Always set page to 1 when applying filters
		params.set("page", "1");

		// Debug the URL
		const urlString = params.toString();
		console.log("URL parameters:", urlString);

		// Use Next.js router for client-side navigation
		startTransition(() => {
			router.push(`${pathname}?${urlString}`);
		});
	}, [filters, router, pathname, startTransition]);

	// Reset filters function
	const resetFilters = useCallback(() => {
		const defaultFilters = getInitialFilters();
		setFilters(defaultFilters);
		setAppliedFilters(defaultFilters);
		console.log("Resetting filters with URL:", `/techniques?page=1`);
		
		// Use Next.js router for client-side navigation
		startTransition(() => {
			router.push(`${pathname}?page=1`);
		});
	}, [getInitialFilters, router, pathname, startTransition]);

	// Page change handler function
	const handlePageChange = useCallback((newPage: number) => {
		// Build URL with applied filters and new page
		const params = new URLSearchParams();

		// Add search if provided
		if (appliedFilters.search) {
			params.set("search", appliedFilters.search);
			params.set("search_fields", "name");
		}

		// Add assurance goals - each as a separate parameter, just like in applyFilters
		if (appliedFilters.assurance_goals.length > 0) {
			appliedFilters.assurance_goals.forEach((goalId) => {
				params.append("assurance_goals", goalId);
			});
		}

		// Add tags - each as a separate parameter
		if (appliedFilters.tags.length > 0) {
			appliedFilters.tags.forEach((tagId) => {
				params.append("tags", tagId);
			});
		}

		// Add max complexity if not at default
		if (appliedFilters.complexity_max && appliedFilters.complexity_max < 5) {
			params.set("complexity_max", appliedFilters.complexity_max.toString());
		}

		// Add max computational cost if not at default
		if (
			appliedFilters.computational_cost_max &&
			appliedFilters.computational_cost_max < 5
		) {
			params.set(
				"computational_cost_max",
				appliedFilters.computational_cost_max.toString()
			);
		}

		// Set the new page parameter
		params.set("page", newPage.toString());

		// Navigate to new page using Next.js router
		const queryString = params.toString();
		console.log("Changing page with URL:", `/techniques?${queryString}`);
		
		startTransition(() => {
			router.push(`${pathname}?${queryString}`);
		});
	}, [appliedFilters, router, pathname, startTransition]);

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="flex flex-row items-center gap-2">
					<h1 className="text-2xl sm:text-3xl font-bold">
						Techniques
					</h1>
				</div>
				<Button asChild size="sm" className="w-full sm:w-auto">
					<Link href="/techniques/add">Add New Technique</Link>
				</Button>
			</div>

			{/* Main content with sidebar */}
			<div className="flex flex-col md:flex-row gap-6 relative">
				{/* Sidebar with sticky behavior on desktop */}
				{isSidebarOpen && (
					<div className="md:w-80 md:sticky md:top-4 md:self-start">
						<TechniquesSidebar
							filters={filters}
							setFilters={setFilters}
							applyFilters={applyFilters}
							resetFilters={resetFilters}
							assuranceGoals={assuranceGoalsData?.results}
							tags={tagsData?.results}
							isDataLoading={
								isLoadingGoals || isLoadingTags
							}
							isMobileOpen={isSidebarOpen}
							setIsMobileOpen={setSidebarOpen}
							allowToggle={
								true
							} /* Pass flag to show toggle button in header */
						/>
					</div>
				)}

				{/* Filter buttons when sidebar is closed */}
				{!isSidebarOpen && (
					<>
						{/* Desktop sticky filter button (positioned on the left) */}
						<div className="hidden md:block sticky top-4 z-30 h-0">
							<Button
								variant="outline"
								onClick={() => setSidebarOpen(true)}
								className="flex items-center gap-2 shadow-md"
								size="sm"
							>
								<Filter className="h-4 w-4 mr-1" />
							</Button>
						</div>

						{/* Mobile floating button */}
						<div className="fixed bottom-6 right-6 z-40 md:hidden">
							<Button
								variant="secondary"
								onClick={() => setSidebarOpen(true)}
								className="rounded-full shadow-md w-12 h-12 p-0"
								aria-label="Show filters"
							>
								<Filter className="h-5 w-5" />
							</Button>
						</div>
					</>
				)}

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
									{/* Improved responsive grid with smaller cards on xs screens */}
									<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
										{techniques.map(
											(technique: Technique) => (
												<TechniqueCard
													key={technique.slug}
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