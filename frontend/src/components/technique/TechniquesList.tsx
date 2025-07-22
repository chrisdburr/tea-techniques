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
import type { Technique, APIResponse, AssuranceGoal, Tag } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getDataConfig } from "@/lib/config/dataConfig";

// Number of items per page - must match backend setting (20)
const PAGE_SIZE = 20;

// Props interface for optional initial data (for SSG support)
interface TechniquesListProps {
  initialData?: APIResponse<Technique>;
  initialAssuranceGoals?: APIResponse<AssuranceGoal>;
  initialTags?: APIResponse<Tag>;
}

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

export default function TechniquesList({
  initialData,
  initialAssuranceGoals,
  initialTags,
}: TechniquesListProps = {}) {
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

  // In static mode, manage page state directly
  const [staticCurrentPage, setStaticCurrentPage] = useState(1);
  const { currentPage: urlCurrentPage } = useFilterParams({
    search: "",
    assurance_goal: "all",
    tags: "",
    page: "1",
  });

  // Use static page in static mode, URL page otherwise
  const config = getDataConfig();
  const currentPage =
    config.dataSource === "static" || config.dataSource === "mock"
      ? staticCurrentPage
      : urlCurrentPage;

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
      const parsedComplexity = parseInt(complexityParam, 10);
      console.log(
        "🔍 DEBUG: Parsing complexity_max:",
        complexityParam,
        "→",
        parsedComplexity,
        "isNaN?",
        isNaN(parsedComplexity),
      );
      initialFilters.complexity_max = parsedComplexity;
    }

    const compCostParam = searchParams.get("computational_cost_max");
    if (compCostParam) {
      const parsedCompCost = parseInt(compCostParam, 10);
      console.log(
        "🔍 DEBUG: Parsing computational_cost_max:",
        compCostParam,
        "→",
        parsedCompCost,
        "isNaN?",
        isNaN(parsedCompCost),
      );
      initialFilters.computational_cost_max = parsedCompCost;
    }

    console.log("🔍 DEBUG: Final initialFilters:", initialFilters);
    console.log("Initialized filters from URL:", initialFilters);
    return initialFilters;
  }, [searchParams]);

  // State for the filters being edited by the user (not yet applied)
  const [filters, setFilters] = useState<FilterState>(getInitialFilters);

  // State for the filters that have been applied (used for API calls)
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(getInitialFilters);

  // Update filters when URL parameters change
  useEffect(() => {
    // Get filters from URL parameters
    const updatedFilters = getInitialFilters();
    setFilters(updatedFilters);
    setAppliedFilters(updatedFilters);
  }, [searchParams, getInitialFilters]);

  // Convert back to URL format for API calls - but using appliedFilters not filters
  const apiFilters = useMemo(() => {
    console.log(
      "🔍 DEBUG: Computing apiFilters with appliedFilters:",
      appliedFilters,
    );
    console.log(
      "🔍 DEBUG: complexity_max value:",
      appliedFilters.complexity_max,
      "type:",
      typeof appliedFilters.complexity_max,
    );
    console.log(
      "🔍 DEBUG: computational_cost_max value:",
      appliedFilters.computational_cost_max,
      "type:",
      typeof appliedFilters.computational_cost_max,
    );

    try {
      const result = {
        search: appliedFilters.search,
        search_fields: "name",
        // Pass all assurance goals, not just the first one
        assurance_goals:
          appliedFilters.assurance_goals.length > 0
            ? appliedFilters.assurance_goals
            : undefined,
        tags: appliedFilters.tags.length > 0 ? appliedFilters.tags : undefined,
        complexity_max: appliedFilters.complexity_max?.toString(),
        computational_cost_max:
          appliedFilters.computational_cost_max?.toString(),
      };
      console.log("🔍 DEBUG: apiFilters computed successfully:", result);
      return result;
    } catch (error) {
      console.error("🚨 ERROR in apiFilters computation:", error);
      throw error;
    }
  }, [appliedFilters]);

  // Fetch data from API or use initial data
  console.log(
    "🔍 DEBUG: About to call useTechniques with:",
    apiFilters,
    "page:",
    currentPage,
    "staticCurrentPage:",
    staticCurrentPage,
  );
  const {
    data: techniquesData,
    isLoading,
    error,
  } = useTechniques(apiFilters, currentPage);
  console.log("🔍 DEBUG: useTechniques returned:", {
    techniquesData,
    isLoading,
    error,
  });

  // Use initial data if provided, otherwise fetch from API
  console.log("🔍 DEBUG: About to call useTags and useAssuranceGoals");
  const { data: tagsData, isLoading: isLoadingTags } = useTags();
  const { data: assuranceGoalsData, isLoading: isLoadingGoals } =
    useAssuranceGoals();
  console.log(
    "🔍 DEBUG: Hooks completed - tags:",
    tagsData,
    "goals:",
    assuranceGoalsData,
  );

  // Override with initial data when available (for SSG)
  // BUT: In static mode with client-side pagination, we need to use the fetched data
  // after the first render to get the correct page of results
  const dataConfig = getDataConfig();
  const isStaticMode =
    dataConfig.dataSource === "static" || dataConfig.dataSource === "mock";
  const shouldUseInitialData =
    initialData && currentPage === 1 && !isStaticMode;

  const finalTechniquesData = shouldUseInitialData
    ? initialData
    : techniquesData;
  const finalTagsData = initialTags || tagsData;
  const finalAssuranceGoalsData = initialAssuranceGoals || assuranceGoalsData;

  // Adjust loading states when initial data is provided
  console.log(
    "🔍 DEBUG: Loading states - initialData:",
    !!initialData,
    "isLoading:",
    isLoading,
    "finalTechniquesData:",
    !!finalTechniquesData,
  );

  // Only use initial data if finalTechniquesData is undefined/null
  // This prevents showing wrong loading state when data is still loading
  const isActuallyLoading = finalTechniquesData ? false : isLoading;
  const isActuallyLoadingTags = initialTags ? false : isLoadingTags;
  const isActuallyLoadingGoals = initialAssuranceGoals ? false : isLoadingGoals;

  // Get techniques directly from API response - no client-side filtering needed
  // The StaticDataService already handles all filtering based on the parameters
  const techniques = useMemo(() => {
    console.log("🔍 DEBUG: finalTechniquesData:", finalTechniquesData);
    console.log(
      "🔍 DEBUG: finalTechniquesData type:",
      typeof finalTechniquesData,
    );
    console.log(
      "🔍 DEBUG: finalTechniquesData keys:",
      finalTechniquesData ? Object.keys(finalTechniquesData) : "undefined",
    );

    // Type assertion to ensure TypeScript knows the structure
    const data = finalTechniquesData as { results?: Technique[] } | undefined;
    const results = data?.results || [];
    console.log("🔍 DEBUG: extracted results length:", results.length);
    console.log("🔍 DEBUG: first technique:", results[0]?.name);

    return results;
  }, [finalTechniquesData]);

  // Calculate pagination information using the total count from the API response
  // Get the total count from the API response
  const apiTotalCount = (finalTechniquesData as { count?: number })?.count || 0;
  const totalPages = calculateTotalPages(apiTotalCount, PAGE_SIZE);

  // Apply filters function
  const applyFilters = useCallback(
    (filtersToApply: FilterState) => {
      // Now requires explicit filters to be passed
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
          filtersToApply.assurance_goals,
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
        filtersToApply.complexity_max !== null &&
        typeof filtersToApply.complexity_max === "number" &&
        filtersToApply.complexity_max < 5
      ) {
        try {
          console.log(
            "🔍 DEBUG: About to call toString() on complexity_max:",
            filtersToApply.complexity_max,
          );
          params.set(
            "complexity_max",
            filtersToApply.complexity_max.toString(),
          );
          console.log("🔍 DEBUG: Successfully set complexity_max parameter");
        } catch (error) {
          console.error(
            "🚨 ERROR calling toString() on complexity_max:",
            error,
            "Value:",
            filtersToApply.complexity_max,
          );
          throw error;
        }
      }

      if (
        filtersToApply.computational_cost_max !== undefined &&
        filtersToApply.computational_cost_max !== null &&
        typeof filtersToApply.computational_cost_max === "number" &&
        filtersToApply.computational_cost_max < 5
      ) {
        try {
          console.log(
            "🔍 DEBUG: About to call toString() on computational_cost_max:",
            filtersToApply.computational_cost_max,
          );
          params.set(
            "computational_cost_max",
            filtersToApply.computational_cost_max.toString(),
          );
          console.log(
            "🔍 DEBUG: Successfully set computational_cost_max parameter",
          );
        } catch (error) {
          console.error(
            "🚨 ERROR calling toString() on computational_cost_max:",
            error,
            "Value:",
            filtersToApply.computational_cost_max,
          );
          throw error;
        }
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
    },
    [router, pathname, startTransition],
  );

  // Reset filters function
  const resetFilters = useCallback(() => {
    const defaultFilters: FilterState = {
      search: "",
      assurance_goals: [],
      tags: [],
      complexity_max: 5,
      computational_cost_max: 5,
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    console.log("Resetting filters with URL:", `/techniques?page=1`);

    // Use Next.js router for client-side navigation
    startTransition(() => {
      router.push(`${pathname}?page=1`);
    });
  }, [router, pathname, startTransition]);

  // Page change handler function
  const handlePageChange = useCallback(
    (newPage: number) => {
      const config = getDataConfig();

      // In static mode, just update the local state
      if (config.dataSource === "static" || config.dataSource === "mock") {
        setStaticCurrentPage(newPage);
        return;
      }

      // In API mode, use URL-based pagination
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
      if (
        appliedFilters.complexity_max !== undefined &&
        appliedFilters.complexity_max !== null &&
        typeof appliedFilters.complexity_max === "number" &&
        appliedFilters.complexity_max < 5
      ) {
        try {
          console.log(
            "🔍 DEBUG: handlePageChange - About to call toString() on complexity_max:",
            appliedFilters.complexity_max,
          );
          params.set(
            "complexity_max",
            appliedFilters.complexity_max.toString(),
          );
          console.log(
            "🔍 DEBUG: handlePageChange - Successfully set complexity_max parameter",
          );
        } catch (error) {
          console.error(
            "🚨 ERROR handlePageChange calling toString() on complexity_max:",
            error,
            "Value:",
            appliedFilters.complexity_max,
          );
          throw error;
        }
      }

      // Add max computational cost if not at default
      if (
        appliedFilters.computational_cost_max !== undefined &&
        appliedFilters.computational_cost_max !== null &&
        typeof appliedFilters.computational_cost_max === "number" &&
        appliedFilters.computational_cost_max < 5
      ) {
        try {
          console.log(
            "🔍 DEBUG: handlePageChange - About to call toString() on computational_cost_max:",
            appliedFilters.computational_cost_max,
          );
          params.set(
            "computational_cost_max",
            appliedFilters.computational_cost_max.toString(),
          );
          console.log(
            "🔍 DEBUG: handlePageChange - Successfully set computational_cost_max parameter",
          );
        } catch (error) {
          console.error(
            "🚨 ERROR handlePageChange calling toString() on computational_cost_max:",
            error,
            "Value:",
            appliedFilters.computational_cost_max,
          );
          throw error;
        }
      }

      // Set the new page parameter
      try {
        console.log(
          "🔍 DEBUG: handlePageChange - About to call toString() on newPage:",
          newPage,
          "type:",
          typeof newPage,
        );
        params.set("page", newPage.toString());
        console.log(
          "🔍 DEBUG: handlePageChange - Successfully set page parameter",
        );
      } catch (error) {
        console.error(
          "🚨 ERROR handlePageChange calling toString() on newPage:",
          error,
          "Value:",
          newPage,
          "Type:",
          typeof newPage,
        );
        throw error;
      }

      // Navigate to new page using Next.js router
      let queryString: string;
      try {
        console.log(
          "🔍 DEBUG: handlePageChange - About to call toString() on URLSearchParams",
        );
        queryString = params.toString();
        console.log(
          "🔍 DEBUG: handlePageChange - Successfully converted params to string:",
          queryString,
        );
      } catch (error) {
        console.error(
          "🚨 ERROR handlePageChange calling toString() on URLSearchParams:",
          error,
          "Params:",
          params,
        );
        throw error;
      }
      console.log("Changing page with URL:", `/techniques?${queryString}`);

      startTransition(() => {
        router.push(`${pathname}?${queryString}`);
      });
    },
    [appliedFilters, router, pathname, startTransition, setStaticCurrentPage],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-row items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Techniques</h1>
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
              assuranceGoals={finalAssuranceGoalsData?.results}
              tags={finalTagsData?.results}
              isDataLoading={isActuallyLoadingGoals || isActuallyLoadingTags}
              isMobileOpen={isSidebarOpen}
              setIsMobileOpen={setSidebarOpen}
              allowToggle={true} /* Pass flag to show toggle button in header */
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
          {isActuallyLoading ? (
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
                  {/* Improved responsive grid with smaller cards on xs screens */}
                  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {techniques.map((technique: Technique) => (
                      <TechniqueCard
                        key={technique.slug}
                        technique={technique}
                      />
                    ))}
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
