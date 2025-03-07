// src/components/technique/AttributeVisualizer.tsx
import React from "react";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { InfoLabel } from "@/components/ui/info-label";
import { AttributeValue } from "@/lib/types";

// Define visualization types
type VisualizationType = "stars" | "badge" | "percentage" | "default";

// Define mapping of attribute types to visualization methods
interface AttributeConfig {
	visualizationType: VisualizationType;
	tooltip: string;
	valueMapper?: (value: string | number) => string | number;
}

// Attribute type to visualization mapping
const ATTRIBUTE_CONFIGS: Record<string, AttributeConfig> = {
	Complexity: {
		visualizationType: "stars",
		tooltip: "How complex is this technique to implement (1-5)",
		valueMapper: (value) => Number(value) || 0,
	},
	"Computational Cost": {
		visualizationType: "stars",
		tooltip: "How computationally expensive is this technique (1-5)",
		valueMapper: (value) => Number(value) || 0,
	},
	// Add configurations for new attribute types from the API
	"Explanatory Scope": {
		visualizationType: "default",
		tooltip: "Whether the technique provides local or global explanations",
	},
};

interface AttributeVisualizerProps {
	attributeValues: AttributeValue[];
}

export const AttributeVisualizer: React.FC<AttributeVisualizerProps> = ({
	attributeValues,
}) => {
	// Group attributes by type
	const attributesByType = attributeValues.reduce((acc, attr) => {
		const type = attr.attribute_type_name;
		if (!acc[type]) {
			acc[type] = [];
		}
		acc[type].push(attr);
		return acc;
	}, {} as Record<string, AttributeValue[]>);

	return (
		<div className="space-y-4">
			{Object.entries(attributesByType).map(([type, attrs]) => {
				const config = ATTRIBUTE_CONFIGS[type] || {
					visualizationType: "default",
					tooltip: `${type} attribute`,
				};

				// Get first attribute value for this type (for single-value attributes like ratings)
				const attr = attrs[0];
				const rawValue = attr.name;
				const value = config.valueMapper
					? config.valueMapper(rawValue)
					: rawValue;

				return (
					<div key={type} className="space-y-1">
						<h3 className="text-sm font-medium">
							<InfoLabel label={type} tooltip={config.tooltip} />
						</h3>

						{/* Render based on visualization type */}
						{config.visualizationType === "stars" && (
							<div className="flex items-center gap-2">
								<StarRating
									rating={
										typeof value === "number" ? value : 0
									}
									className="text-primary"
								/>
							</div>
						)}

						{config.visualizationType === "badge" && (
							<Badge>{String(value)}</Badge>
						)}

						{config.visualizationType === "default" && (
							<div className="flex flex-wrap gap-2">
								{attrs.map((attr) => (
									<Badge key={attr.id} variant="secondary">
										{attr.name}
									</Badge>
								))}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};

export default AttributeVisualizer;
