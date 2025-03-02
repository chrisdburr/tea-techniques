// src/lib/hooks/useFilterParams.ts
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface FilterState {
  [key: string]: string;
}

/**
 * Custom hook for managing filter parameters in URL
 * @param initialFilters Initial filter values
 * @param defaultPage Default page number
 * @returns Filter state and handlers
 */
export function useFilterParams(
  initialFilters: FilterState,
  defaultPage = 1
) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize state from URL parameters
  const [filters, setFilters] = useState<FilterState>(() => {
    const filtersFromUrl: FilterState = { ...initialFilters };
    
    // Get filter values from URL
    Object.keys(initialFilters).forEach(key => {
      const paramValue = searchParams.get(key);
      if (paramValue) {
        filtersFromUrl[key] = paramValue;
      }
    });
    
    // Get page from URL
    const pageParam = searchParams.get("page");
    filtersFromUrl.page = pageParam || defaultPage.toString();
    
    return filtersFromUrl;
  });

  // Update filters when URL parameters change
  useEffect(() => {
    // We need to make sure we're not constantly updating on every render
    // Create a string representation of the current search params
    const searchParamsString = searchParams.toString();
    
    // Only update local state if search params actually changed
    const updateFilters = () => {
      const filtersFromUrl: FilterState = { ...initialFilters };
      
      Object.keys(initialFilters).forEach(key => {
        const paramValue = searchParams.get(key);
        if (paramValue) {
          filtersFromUrl[key] = paramValue;
        }
      });
      
      // Get page from URL
      const pageParam = searchParams.get("page");
      filtersFromUrl.page = pageParam || defaultPage.toString();
      
      setFilters(filtersFromUrl);
    };
    
    updateFilters();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Set a single filter value, preventing unnecessary updates
  const setFilter = (key: string, value: string) => {
    // Only update if the value actually changed to prevent unnecessary renders
    setFilters(prev => {
      if (prev[key] === value) {
        return prev; // Return the same object reference if nothing changed
      }
      return {
        ...prev,
        [key]: value,
      };
    });
  };

  // Apply filters to URL and navigate
  const applyFilters = (resetPage = true) => {
    const params = new URLSearchParams();
    
    // Add all non-empty filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all" && key !== "page") {
        params.set(key, value);
      }
    });
    
    // Set page parameter (reset to 1 if specified)
    params.set("page", resetPage ? "1" : filters.page);
    
    // Navigate to updated URL
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  // Reset all filters to initial values
  const resetFilters = () => {
    setFilters({ 
      ...initialFilters,
      page: "1"
    });
    
    // Navigate to reset URL
    router.push(`${window.location.pathname}?page=1`);
  };

  // Change page and update URL
  const changePage = (newPage: number) => {
    // Build URL with current filters plus new page
    const params = new URLSearchParams();
    
    // Add all non-empty parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all" && key !== "page") {
        params.set(key, value);
      }
    });
    
    // Set the new page parameter
    params.set("page", newPage.toString());
    
    // Navigate to new URL
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  return {
    filters,
    setFilter,
    applyFilters,
    resetFilters,
    changePage,
    currentPage: parseInt(filters.page || "1", 10),
  };
}