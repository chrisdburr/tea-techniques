// TechniquesListSimple.tsx - Simplified version without sidebar
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { calculateTotalPages, useTechniques } from "@/lib/api/hooks";
import TechniqueCard from "@/components/technique/TechniqueCard";
import { Pagination } from "@/components/ui/pagination";
import { Loader2 } from "lucide-react";
import type { Technique, APIResponse, AssuranceGoal, Tag } from "@/lib/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useFilters } from "@/lib/context/filter-context";

// Number of items per page - must match backend setting (20)
const PAGE_SIZE = 20;

// Props interface for optional initial data (for SSG support)
interface TechniquesListProps {
  initialData?: APIResponse<Technique>;
  initialAssuranceGoals?: APIResponse<AssuranceGoal>;
  initialTags?: APIResponse<Tag>;
}

// Empty state component
const EmptyStateComponent = (): JSX.Element => {
  return (
    <div className="text-center py-8">
      <p>No techniques found matching your criteria.</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Try adjusting your filters or search terms.
      </p>
    </div>
  );
};

export default function TechniquesListSimple({
  initialData,
  initialAssuranceGoals,
  initialTags,
}: TechniquesListProps = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { filters } = useFilters();

  // Get current page from URL
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  // Build API filters from context
  const apiFilters = useMemo(() => {
    const apiParams: Record<string, any> = {
      page: currentPage,
    };

    // Add search if present
    if (filters.search) {
      apiParams.search = filters.search;
    }

    // Add assurance goals if present
    if (filters.assuranceGoals.length > 0) {
      apiParams.assurance_goals = filters.assuranceGoals;
    }

    // Collect all tag filters
    const allTags = [
      ...filters.applicableModels,
      ...filters.dataRequirements,
      ...filters.dataTypes,
      ...filters.expertiseNeeded,
      ...filters.lifecycleStage,
      ...filters.techniqueType,
      ...filters.evidenceType,
    ];

    // Add tags if present
    if (allTags.length > 0) {
      apiParams.tags = allTags;
    }

    return apiParams;
  }, [filters, currentPage]);

  // Fetch techniques with filters
  const {
    data: techniques,
    isLoading,
    error,
  } = useTechniques(apiFilters, currentPage);

  // Calculate total pages
  const totalPages = calculateTotalPages(techniques?.count || 0, PAGE_SIZE);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading techniques</p>
        <p className="text-sm text-muted-foreground mt-2">
          {error.message || "Please try again later"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Browse Techniques</h1>
        <p className="text-muted-foreground">
          {techniques?.count || 0} techniques found
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading techniques...</span>
        </div>
      ) : (
        <>
          {techniques?.results && techniques.results.length > 0 ? (
            <div className="grid gap-6">
              {techniques.results.map((technique) => (
                <TechniqueCard key={technique.slug} technique={technique} />
              ))}
            </div>
          ) : (
            <EmptyStateComponent />
          )}

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
