// src/components/ui/info-label.tsx
import React from "react";
import { Info } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

interface InfoLabelProps {
	label: string;
	tooltip: string;
}

export const InfoLabel: React.FC<InfoLabelProps> = ({ label, tooltip }) => {
	return (
		<Tooltip content={tooltip}>
			<div className="inline-flex items-center cursor-help">
				{label}
				<Info className="ml-1 h-4 w-4 text-muted-foreground" />
			</div>
		</Tooltip>
	);
};

export default InfoLabel;
