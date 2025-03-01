// src/lib/hooks/usePagination.ts
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

	// Get initial page from URL or use default
	const [currentPage, setCurrentPage] = useState(initialPage);
	const [errorPages, setErrorPages] = useState<number[]>([]);

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
		}
	}, [searchParams, totalPages]);

	// Function to handle page change
	const handlePageChange = (page: number) => {
		// Don't navigate to pages that have previously caused errors
		if (errorPages.includes(page)) {
			console.warn(
				`Avoiding navigation to page ${page} which previously caused an error`
			);
			return;
		}

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
		router.push(`?${params.toString()}`);

		// Call the onPageChange callback if provided
		if (onPageChange) {
			onPageChange(page);
		}

		setCurrentPage(page);
	};

	// Function to mark a page as causing an error
	const markPageAsError = (page: number) => {
		if (!errorPages.includes(page)) {
			setErrorPages((prev) => [...prev, page]);
		}
	};

	return {
		currentPage,
		totalPages,
		handlePageChange,
		markPageAsError,
		errorPages,
		firstPage: 1,
		lastPage: totalPages,
		hasPrevPage: currentPage > 1,
		hasNextPage:
			currentPage < totalPages && !errorPages.includes(currentPage + 1),
		isPageAccessible: (page: number) =>
			page >= 1 && page <= totalPages && !errorPages.includes(page),
	};
}
