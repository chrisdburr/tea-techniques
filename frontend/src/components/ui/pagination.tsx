// src/components/ui/pagination.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	className?: string;
}

export function Pagination({
	currentPage,
	totalPages,
	onPageChange,
	className,
}: PaginationProps) {
	// Don't render pagination if there's only one page
	if (totalPages <= 1) {
		return null;
	}

	// Safety check to ensure currentPage is within bounds
	const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
	
	// Create an array of page numbers to display
	const getPageNumbers = () => {
		const pageNumbers: number[] = [];
		const maxPagesToShow = 7; // Show at most 7 page numbers at once
		
		if (totalPages <= maxPagesToShow) {
			// If we have 7 or fewer pages, show all of them
			for (let i = 1; i <= totalPages; i++) {
				pageNumbers.push(i);
			}
		} else {
			// Always include first page
			pageNumbers.push(1);
			
			// Calculate start and end of page numbers to show
			let startPage = Math.max(2, safeCurrentPage - 2);
			let endPage = Math.min(totalPages - 1, safeCurrentPage + 2);
			
			// Adjust if we're near the beginning
			if (safeCurrentPage <= 4) {
				startPage = 2;
				endPage = Math.min(totalPages - 1, 6);
			}
			
			// Adjust if we're near the end
			if (safeCurrentPage >= totalPages - 3) {
				startPage = Math.max(2, totalPages - 5);
				endPage = totalPages - 1;
			}
			
			// Add ellipsis if needed before middle pages
			if (startPage > 2) {
				pageNumbers.push(-1); // -1 represents ellipsis
			}
			
			// Add middle pages
			for (let i = startPage; i <= endPage; i++) {
				pageNumbers.push(i);
			}
			
			// Add ellipsis if needed after middle pages
			if (endPage < totalPages - 1) {
				pageNumbers.push(-2); // -2 represents ellipsis (different key)
			}
			
			// Always include last page
			pageNumbers.push(totalPages);
		}
		
		return pageNumbers;
	};

	const pageNumbers = getPageNumbers();

	return (
		<nav className={cn("flex items-center justify-center space-x-1", className)} aria-label="Pagination">
			{/* Previous page button */}
			<Button
				variant="outline"
				size="icon"
				onClick={() => onPageChange(safeCurrentPage - 1)}
				disabled={safeCurrentPage === 1}
				className="h-8 w-8"
				aria-label="Previous page"
			>
				<ChevronLeft className="h-4 w-4" />
			</Button>
			
			{/* Page number buttons */}
			{pageNumbers.map((pageNumber) => {
				// Render ellipsis
				if (pageNumber < 0) {
					return (
						<span 
							key={`ellipsis-${pageNumber}`} 
							className="px-2 text-sm text-muted-foreground"
						>
							…
						</span>
					);
				}
				
				// Render page number
				return (
					<Button
						key={pageNumber}
						variant={pageNumber === safeCurrentPage ? "default" : "outline"}
						size="sm"
						onClick={() => onPageChange(pageNumber)}
						className="h-8 w-8"
						aria-current={pageNumber === safeCurrentPage ? "page" : undefined}
						aria-label={`Page ${pageNumber}`}
					>
						{pageNumber}
					</Button>
				);
			})}
			
			{/* Next page button */}
			<Button
				variant="outline"
				size="icon"
				onClick={() => onPageChange(safeCurrentPage + 1)}
				disabled={safeCurrentPage === totalPages}
				className="h-8 w-8"
				aria-label="Next page"
			>
				<ChevronRight className="h-4 w-4" />
			</Button>
		</nav>
	);
}