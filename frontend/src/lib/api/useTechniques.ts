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
import type { Technique } from "@/lib/types";

// Re-export with legacy name for backward compatibility
export const useAddTechnique = useCreateTechnique;

// Re-export other hooks with their standard names
export { useTechniques, useUpdateTechnique, useDeleteTechnique };

// Re-export the updated type
export type { Technique };
