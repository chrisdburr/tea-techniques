// src/lib/hooks/useFilterParams.ts
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

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
  const pathname = usePathname();

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

  /**
   * Set a single filter value, preventing unnecessary updates
   * 
   * This function updates a single filter value in the state. It includes
   * an optimization to prevent unnecessary re-renders by returning the same
   * state reference if the value hasn't actually changed.
   * 
   * @param key - The filter key to update
   * @param value - The new value for the filter
   */
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

  /**
   * Create URL search parameters from the current filter state
   * 
   * This converts the component's filter state into URL search parameters,
   * handling the conversion from singular field names (used in the component)
   * to plural field names (expected by the backend API).
   * 
   * @param resetPageParam - Whether to reset the page parameter to 1 (default: true)
   * @returns URLSearchParams object with the filter parameters
   */
  const createSearchParams = useCallback((resetPageParam = true) => {
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
    params.set("page", resetPageParam ? "1" : filters.page);
    
    return params;
  }, [filters]);

  /**
   * Apply filters to the URL and navigate to the filtered view
   * 
   * This converts the current filter state to URL parameters and
   * navigates to the updated URL, triggering a filtered view of the data.
   * 
   * @param resetPage - Whether to reset the page to 1 (default: true)
   */
  const applyFilters = useCallback((resetPage = true) => {
    const params = createSearchParams(resetPage);
    
    try {
      // Use Next.js router.push for client-side navigation
      router.push(`${pathname}?${params.toString()}`);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [createSearchParams, router, pathname]);

  /**
   * Reset all filters to their initial values
   * 
   * This resets the filter state to the initial values provided when the hook was
   * initialized, and navigates to the URL with only the page parameter set to 1.
   */
  const resetFilters = useCallback(() => {
    // Update local state
    setFilters({ 
      ...initialFilters,
      page: "1"
    });
    
    // Use Next.js router for navigation
    try {
      router.push(`${pathname}?page=1`);
    } catch (error) {
      console.error("Reset navigation error:", error);
    }
  }, [initialFilters, router, pathname]);

  /**
   * Change the current page and update the URL
   * 
   * This navigates to a different page while preserving all other filter parameters.
   * It handles the conversion from singular field names (component) to plural field
   * names (backend) just like other filter methods.
   * 
   * @param newPage - The page number to navigate to
   */
  const changePage = useCallback((newPage: number) => {
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
    
    // Use Next.js router for navigation
    try {
      router.push(`${pathname}?${params.toString()}`);
    } catch (error) {
      console.error("Page change navigation error:", error);
    }
  }, [filters, router, pathname]);

  return {
    filters,
    setFilter,
    applyFilters,
    resetFilters,
    changePage,
    currentPage: parseInt(filters.page || "1", 10),
  };
}