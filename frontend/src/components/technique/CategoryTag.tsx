import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryTagProps {
	name: string;
	className?: string;
	variant?: "default" | "secondary" | "outline" | "destructive";
	isSelected?: boolean;
	onClick?: () => void;
}

// Format a category name from hyphenated format to title case
export const formatCategoryName = (name: string): string => {
	return name
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
};

export const CategoryTag: React.FC<CategoryTagProps> = ({
	name,
	className,
	variant = "outline",
	isSelected = false,
	onClick,
}) => {
	const formattedName = formatCategoryName(name);

	return (
		<Badge
			variant={isSelected ? "default" : variant}
			className={cn(
				"cursor-pointer hover:bg-muted transition-colors",
				onClick ? "cursor-pointer" : "",
				className
			)}
			onClick={onClick}
		>
			{formattedName}
		</Badge>
	);
};

export default CategoryTag;
