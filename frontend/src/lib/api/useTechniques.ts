// src/lib/api/useTechniques.ts
/**
 * @deprecated This file is maintained for backward compatibility.
 * Import from hooks.ts directly instead.
 */

import {
	useTechniques,
	useCreateTechnique,
	useUpdateTechnique,
	useDeleteTechnique,
} from "./hooks";

// Re-export with legacy name for backward compatibility
export const useAddTechnique = useCreateTechnique;

// Re-export other hooks with their standard names
export { useTechniques, useUpdateTechnique, useDeleteTechnique };

// Re-export types
export interface Technique {
	id: number;
	name: string;
	description: string;
	model_dependency: string;
	example_use_case: string;
}
