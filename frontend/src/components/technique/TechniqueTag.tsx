import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatTagDisplay } from "@/lib/utils";

interface TechniqueTagProps {
	name: string;
	className?: string;
	variant?: "default" | "secondary" | "outline" | "destructive";
	isSelected?: boolean;
	onClick?: () => void;
	showPrefix?: boolean;
}

export const TechniqueTag: React.FC<TechniqueTagProps> = ({
	name,
	className,
	variant = "outline",
	isSelected = false,
	onClick,
	showPrefix = false,
}) => {
	const displayName = formatTagDisplay(name, showPrefix);

	return (
		<Badge
			variant={isSelected ? "default" : variant}
			className={cn(
				"transition-colors",
				onClick ? "cursor-pointer hover:bg-muted" : "",
				className
			)}
			onClick={onClick}
		>
			{displayName}
		</Badge>
	);
};

export default TechniqueTag;