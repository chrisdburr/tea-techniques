"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface FilterContextType {
  // Filter values
  filters: {
    search: string;
    assuranceGoals: string[];
    applicableModels: string[];
    dataRequirements: string[];
    dataTypes: string[];
    expertiseNeeded: string[];
    lifecycleStage: string[];
    techniqueType: string[];
    evidenceType: string[];
  };

  // Update functions
  updateFilter: (
    filterType: keyof FilterContextType["filters"],
    value: string | string[],
  ) => void;
  toggleFilter: (
    filterType: keyof FilterContextType["filters"],
    value: string,
  ) => void;
  clearAllFilters: () => void;
  clearFilterType: (filterType: keyof FilterContextType["filters"]) => void;

  // Helper functions
  isFilterActive: (
    filterType: keyof FilterContextType["filters"],
    value: string,
  ) => boolean;
  getActiveFilterCount: () => number;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filters from URL
  const initializeFilters = useCallback(() => {
    return {
      search: searchParams.get("search") || "",
      assuranceGoals: searchParams.getAll("assurance_goals"),
      applicableModels: searchParams.getAll("applicable_models"),
      dataRequirements: searchParams.getAll("data_requirements"),
      dataTypes: searchParams.getAll("data_types"),
      expertiseNeeded: searchParams.getAll("expertise_needed"),
      lifecycleStage: searchParams.getAll("lifecycle_stage"),
      techniqueType: searchParams.getAll("technique_type"),
      evidenceType: searchParams.getAll("evidence_type"),
    };
  }, [searchParams]);

  const [filters, setFilters] = useState(initializeFilters);

  // Update filters when URL changes
  useEffect(() => {
    setFilters(initializeFilters());
  }, [searchParams, initializeFilters]);

  // Sync filters to URL
  const syncToUrl = useCallback(
    (newFilters: typeof filters) => {
      const params = new URLSearchParams();

      // Add search
      if (newFilters.search) {
        params.set("search", newFilters.search);
      }

      // Add array filters
      Object.entries(newFilters).forEach(([key, values]) => {
        if (key !== "search" && Array.isArray(values) && values.length > 0) {
          // Convert camelCase to snake_case for URL
          const urlKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
          values.forEach((value) => params.append(urlKey, value));
        }
      });

      // Navigate to new URL
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname],
  );

  // Update a filter
  const updateFilter = useCallback(
    (filterType: keyof typeof filters, value: string | string[]) => {
      const newFilters = {
        ...filters,
        [filterType]: value,
      };
      setFilters(newFilters);
      syncToUrl(newFilters);
    },
    [filters, syncToUrl],
  );

  // Toggle a filter value
  const toggleFilter = useCallback(
    (filterType: keyof typeof filters, value: string) => {
      if (filterType === "search") return;

      const currentValues = filters[filterType] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      updateFilter(filterType, newValues);
    },
    [filters, updateFilter],
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const clearedFilters = {
      search: "",
      assuranceGoals: [],
      applicableModels: [],
      dataRequirements: [],
      dataTypes: [],
      expertiseNeeded: [],
      lifecycleStage: [],
      techniqueType: [],
      evidenceType: [],
    };
    setFilters(clearedFilters);
    router.push(pathname);
  }, [router, pathname]);

  // Clear a specific filter type
  const clearFilterType = useCallback(
    (filterType: keyof typeof filters) => {
      const newFilters = {
        ...filters,
        [filterType]: filterType === "search" ? "" : [],
      };
      setFilters(newFilters);
      syncToUrl(newFilters);
    },
    [filters, syncToUrl],
  );

  // Check if a filter is active
  const isFilterActive = useCallback(
    (filterType: keyof typeof filters, value: string) => {
      if (filterType === "search") {
        return filters.search === value;
      }
      return (filters[filterType] as string[]).includes(value);
    },
    [filters],
  );

  // Get count of active filters
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (filters.search) count++;
    Object.entries(filters).forEach(([key, values]) => {
      if (key !== "search" && Array.isArray(values)) {
        count += values.length;
      }
    });
    return count;
  }, [filters]);

  return (
    <FilterContext.Provider
      value={{
        filters,
        updateFilter,
        toggleFilter,
        clearAllFilters,
        clearFilterType,
        isFilterActive,
        getActiveFilterCount,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}
