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
    
    // Get filter values from URL (for standard parameters)
    Object.keys(initialFilters).forEach(key => {
      const paramValue = searchParams.get(key);
      if (paramValue) {
        filtersFromUrl[key] = paramValue;
      }
    });
    
    // Special handling for plural parameter names from backend
    
    // Handle assurance_goals (plural) -> assurance_goal (singular) for component state
    const assuranceGoalsParam = searchParams.get("assurance_goals");
    if (assuranceGoalsParam) {
      filtersFromUrl.assurance_goal = assuranceGoalsParam;
    }
    
    // Handle categories (plural) -> category (singular) for component state
    const categoriesParam = searchParams.get("categories");
    if (categoriesParam) {
      filtersFromUrl.category = categoriesParam;
    }
    
    // Get page from URL
    const pageParam = searchParams.get("page");
    filtersFromUrl.page = pageParam || defaultPage.toString();
    
    return filtersFromUrl;
  });

  // Update filters when URL parameters change
  useEffect(() => {
    // Only update local state if search params actually changed
    const updateFilters = () => {
      const filtersFromUrl: FilterState = { ...initialFilters };
      let hasChanged = false;
      
      // Process standard parameters (singular names in the component state)
      Object.keys(initialFilters).forEach(key => {
        const paramValue = searchParams.get(key);
        if (paramValue) {
          if (filtersFromUrl[key] !== paramValue) {
            hasChanged = true;
            filtersFromUrl[key] = paramValue;
          }
        } else if (filtersFromUrl[key] !== initialFilters[key]) {
          hasChanged = true;
          filtersFromUrl[key] = initialFilters[key];
        }
      });
      
      // Special handling for backend plural parameter names
      
      // Handle assurance_goals (plural) -> assurance_goal (singular)
      const assuranceGoalsParam = searchParams.get("assurance_goals");
      if (assuranceGoalsParam) {
        if (filtersFromUrl.assurance_goal !== assuranceGoalsParam) {
          hasChanged = true;
          filtersFromUrl.assurance_goal = assuranceGoalsParam;
        }
      }
      
      // Handle categories (plural) -> category (singular)
      const categoriesParam = searchParams.get("categories");
      if (categoriesParam) {
        if (filtersFromUrl.category !== categoriesParam) {
          hasChanged = true;
          filtersFromUrl.category = categoriesParam;
        }
      }
      
      // Get page from URL
      const pageParam = searchParams.get("page");
      const newPage = pageParam || defaultPage.toString();
      if (filtersFromUrl.page !== newPage) {
        hasChanged = true;
        filtersFromUrl.page = newPage;
      }
      
      // Only update state if values actually changed
      if (hasChanged) {
        setFilters(filtersFromUrl);
      }
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
    
    // Convert from component parameter names to backend parameter names (singular to plural)
    
    // Handle assurance_goal -> assurance_goals (backend expects plural)
    if (filters.assurance_goal && filters.assurance_goal !== "all") {
      params.set("assurance_goals", filters.assurance_goal); 
    }
    
    // Handle category -> categories (backend expects plural)
    if (filters.category && filters.category !== "all") {
      params.set("categories", filters.category);
    }
    
    // Add search parameter if provided
    if (filters.search) {
      params.set("search", filters.search);
    }
    
    // Set page parameter (reset to 1 if specified)
    params.set("page", resetPage ? "1" : filters.page);
    
    // Use direct navigation for most reliable behavior
    try {
      // Build the URL with the correct query parameters
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      
      // Navigate using window.location for a reliable page update
      window.location.href = newUrl;
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  // Reset all filters to initial values
  const resetFilters = () => {
    // Update local state
    setFilters({ 
      ...initialFilters,
      page: "1"
    });
    
    // Use direct URL navigation for reliable reset
    try {
      window.location.href = `${window.location.pathname}?page=1`;
    } catch (error) {
      console.error("Reset navigation error:", error);
    }
  };

  // Change page and update URL
  const changePage = (newPage: number) => {
    // Build URL with current filters plus new page
    const params = new URLSearchParams();
    
    // Apply backend-expected parameter names
    
    // Handle assurance_goal -> assurance_goals (plural)
    if (filters.assurance_goal && filters.assurance_goal !== "all") {
      params.set("assurance_goals", filters.assurance_goal);
    }
    
    // Handle category -> categories (plural)
    if (filters.category && filters.category !== "all") {
      params.set("categories", filters.category);
    }
    
    // Add search parameter if provided
    if (filters.search) {
      params.set("search", filters.search);
    }
    
    // Set the new page parameter
    params.set("page", newPage.toString());
    
    // Use direct navigation for reliable page change
    try {
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.location.href = newUrl;
    } catch (error) {
      console.error("Page change navigation error:", error);
    }
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