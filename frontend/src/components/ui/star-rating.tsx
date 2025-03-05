// src/components/ui/star-rating.tsx
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
	rating: number;
	maxRating?: number;
	className?: string;
	size?: "sm" | "md" | "lg";
}

export function StarRating({
	rating,
	maxRating = 5,
	className,
	size = "md",
}: StarRatingProps) {
	// Handle invalid ratings gracefully
	const validRating = Math.max(0, Math.min(Math.round(rating), maxRating));

	// Determine star sizes based on the size prop
	const starSize = {
		sm: "w-3 h-3",
		md: "w-4 h-4",
		lg: "w-5 h-5",
	}[size];

	return (
		<div className={cn("flex items-center gap-1", className)}>
			{[...Array(maxRating)].map((_, i) => (
				<Star
					key={i}
					className={cn(
						starSize,
						i < validRating
							? "text-yellow-500 fill-yellow-500" // Filled star
							: "text-gray-300 dark:text-gray-600" // Empty star
					)}
				/>
			))}
		</div>
	);
}
