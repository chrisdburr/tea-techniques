// src/lib/hooks/usePagination.ts
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface UsePaginationProps {
  totalItems: number;
  pageSize?: number;
  initialPage?: number;
  onPageChange?: (page: number) => void;
}

export function usePagination({
  totalItems,
  pageSize = 15,
  initialPage = 1,
  onPageChange,
}: UsePaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Get initial page from URL or use default
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Effect to update current page when URL changes
  useEffect(() => {
    const pageParam = searchParams.get("page");
    if (pageParam) {
      const pageNum = parseInt(pageParam, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        setCurrentPage(pageNum);
      }
    } else {
      // If no page parameter, reset to page 1
      setCurrentPage(1);
    }
  }, [searchParams, totalPages]);

  // Function to handle page change
  const handlePageChange = useCallback((page: number) => {
    // Safety check to prevent accessing non-existent pages
    if (page < 1 || page > totalPages) {
      console.warn(
        `Attempted to access invalid page ${page}. Total pages: ${totalPages}`
      );
      return;
    }

    // Update URL with the new page
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);

    // Call the onPageChange callback if provided
    if (onPageChange) {
      onPageChange(page);
    }

    setCurrentPage(page);
  }, [searchParams, router, pathname, totalPages, onPageChange]);

  return {
    currentPage,
    totalPages,
    handlePageChange,
    firstPage: 1,
    lastPage: totalPages,
    hasPrevPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
    isPageAccessible: (page: number) => page >= 1 && page <= totalPages,
  };
}
