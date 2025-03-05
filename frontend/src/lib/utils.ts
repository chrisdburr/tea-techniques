import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { TechniqueAttribute } from "./types";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getTechniqueRatings(attributes: TechniqueAttribute[]) {
	let complexity = 0;
	let computationalCost = 0;

	// Extract ratings from attributes
	attributes.forEach((attr) => {
		if (attr.attribute_type === "Complexity") {
			complexity = Number(attr.attribute_value_name) || 0;
		}
		if (attr.attribute_type === "Computational Cost") {
			computationalCost = Number(attr.attribute_value_name) || 0;
		}
	});

	return { complexity, computationalCost };
}
