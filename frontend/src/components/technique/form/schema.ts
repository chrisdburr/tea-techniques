// src/components/technique/form/schema.ts
import * as z from "zod";
import { TechniqueFormData } from "@/lib/types";

// Zod schema for form validation
export const techniqueSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  complexity_rating: z.number().min(1).max(5).optional(),
  computational_cost_rating: z.number().min(1).max(5).optional(),
  assurance_goal_ids: z.array(z.number()).min(1, { message: "At least one assurance goal is required" }),
  tag_ids: z.array(z.number()),
  related_technique_ids: z.array(z.number()),
  resources: z.array(
    z.object({
      resource_type: z.number(),
      title: z.string(),
      url: z.string(),
      description: z.string(),
      authors: z.string().optional(),
      publication_date: z.string().optional(),
      source_type: z.string().optional(),
    })
  ),
  example_use_cases: z.array(
    z.object({
      description: z.string(),
      assurance_goal: z.number().optional(),
    })
  ),
  limitations: z.array(z.string()),
});

// Initial form data
export const initialFormData: TechniqueFormData = {
  name: "",
  description: "",
  complexity_rating: undefined,
  computational_cost_rating: undefined,
  assurance_goal_ids: [],
  tag_ids: [],
  related_technique_slugs: [],
  resources: [],
  example_use_cases: [],
  limitations: [],
};

// Rating options for select fields
export const ratingOptions = [
  { value: "", label: "Select rating" },
  { value: "1", label: "1 - Very Low" },
  { value: "2", label: "2 - Low" },
  { value: "3", label: "3 - Medium" },
  { value: "4", label: "4 - High" },
  { value: "5", label: "5 - Very High" },
];