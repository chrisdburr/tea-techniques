// frontend/src/lib/api/useTechniques.ts
// This file is being kept for backward compatibility
// All hooks are now in hooks.ts
import { useTechniques, useAddTechnique, useUpdateTechnique } from "./hooks";

// Re-export types
export interface Technique {
	id: number;
	name: string;
	description: string;
	model_dependency: string;
	example_use_case: string;
}

// Re-export hooks
export { useTechniques, useAddTechnique, useUpdateTechnique };