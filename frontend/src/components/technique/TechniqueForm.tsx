// src/components/technique/TechniqueForm.tsx
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useCreateTechnique,
  useUpdateTechnique,
  useAssuranceGoals,
  useCategories,
} from "@/lib/api/hooks";
import { Technique } from "@/lib/types";
import { useForm } from "@/lib/hooks/useForm";
import { useApiError } from "@/lib/hooks/useApiError";
import { FormField } from "@/components/common/FormField";
import { SelectField } from "@/components/common/SelectField";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TechniqueFormProps {
  technique?: Technique;
  isEditMode?: boolean;
}

// Initial form values
const initialFormData = {
  name: "",
  description: "",
  model_dependency: "Model-Agnostic", // Default value
  example_use_case: "",
  assurance_goal: "1", // Default to first assurance goal (string for Select component)
  category: "1", // Default to first category (string for Select component)
};

// Form validators
const validators = {
  name: (value: string) => (!value.trim() ? "Name is required" : null),
  description: (value: string) => (!value.trim() ? "Description is required" : null),
  model_dependency: (value: string) => (!value ? "Model dependency is required" : null),
  example_use_case: () => null, // Optional field
  assurance_goal: () => null, // Always has a value
  category: () => null, // Always has a value
};

const TechniqueForm: React.FC<TechniqueFormProps> = ({
  technique,
  isEditMode = false,
}) => {
  const router = useRouter();
  const { error: apiError, handleError } = useApiError();
  
  // Set up form
  const {
    values: formData,
    errors,
    isSubmitting,
    handleChange,
    handleSelectChange,
    setSubmitting,
    validateForm,
    resetForm,
    setFieldError,
    setFieldValue,
  } = useForm(initialFormData);

  // Fetch dropdown data
  const { data: assuranceGoalsData } = useAssuranceGoals();
  const { data: categoriesData } = useCategories();

  // Set up mutations
  const createMutation = useCreateTechnique();
  const updateMutation = useUpdateTechnique(technique?.id || 0);
  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

  // Initialize form data when editing an existing technique
  useEffect(() => {
    if (isEditMode && technique) {
      resetForm({
        name: technique.name || "",
        description: technique.description || "",
        model_dependency: technique.model_dependency || "Model-Agnostic",
        example_use_case: technique.example_use_case || "",
        assurance_goal: technique.assurance_goal?.toString() || "1",
        category: technique.category?.toString() || "1",
      });
    }
    // Intentionally omitting resetForm from deps as it would cause infinite loops
    // resetForm is stable enough for our use case
  }, [isEditMode, technique]);
  
  // We're now handling the category changes directly in the onChange handler
  // for the assurance_goal SelectField, which is more reliable and avoids infinite loops

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm(validators)) {
      return;
    }

    setSubmitting(true);

    try {
      if (isEditMode && technique) {
        // Update existing technique
        const updateData = {
          id: technique.id,
          name: formData.name,
          description: formData.description,
          model_dependency: formData.model_dependency,
          example_use_case: formData.example_use_case,
          // Convert string IDs to numbers
          assurance_goal: parseInt(formData.assurance_goal, 10),
          category: parseInt(formData.category, 10),
        };

        const result = await updateMutation.mutateAsync(updateData);
        router.push(`/techniques/${result.id}`);
      } else {
        // Create new technique
        const createData = {
          name: formData.name,
          description: formData.description,
          model_dependency: formData.model_dependency,
          example_use_case: formData.example_use_case,
          // Convert string IDs to numbers
          assurance_goal: parseInt(formData.assurance_goal, 10),
          category: parseInt(formData.category, 10),
        };

        const result = await createMutation.mutateAsync(createData);
        router.push(`/techniques/${result.id}`);
      }
    } catch (error) {
      handleError(error);
      setFieldError('submit', apiError?.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter categories by selected assurance goal
  const filteredCategories = categoriesData?.results?.filter(
    (category) => category.assurance_goal.toString() === formData.assurance_goal
  ) || [];

  // Prepare options for select fields
  const assuranceGoalOptions = assuranceGoalsData?.results?.map(goal => ({
    value: goal.id.toString(),
    label: goal.name,
  })) || [];

  const categoryOptions = filteredCategories.map(category => ({
    value: category.id.toString(),
    label: category.name,
  }));

  const dependencyOptions = [
    { value: "Model-Agnostic", label: "Model-Agnostic" },
    { value: "Model-Specific", label: "Model-Specific" },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>
            {isEditMode ? "Edit Technique" : "Add New Technique"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <FormField
              id="name"
              label="Technique Name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Enter technique name"
              required
            />

            <FormField
              id="description"
              label="Description"
              type="textarea"
              value={formData.description}
              onChange={handleChange}
              error={errors.description}
              placeholder="Enter a detailed description"
              required
              rows={4}
            />

            <SelectField
              id="assurance_goal"
              label="Assurance Goal"
              value={formData.assurance_goal}
              onChange={(value) => {
                // If value isn't changing, do nothing to avoid unnecessary updates
                if (value === formData.assurance_goal) return;
                
                // Create batch of changes to apply at once
                const updates: Record<string, string> = {
                  assurance_goal: value
                };
                
                // Find first matching category for this assurance goal
                if (categoriesData?.results) {
                  const firstMatchingCategory = categoriesData.results.find(
                    category => category.assurance_goal.toString() === value
                  );
                  
                  if (firstMatchingCategory) {
                    updates.category = firstMatchingCategory.id.toString();
                  }
                }
                
                // Apply all updates at once
                Object.entries(updates).forEach(([key, val]) => {
                  handleSelectChange(key as keyof typeof formData, val);
                });
              }}
              options={assuranceGoalOptions}
              placeholder="Select an assurance goal"
              required
            />

            <SelectField
              id="category"
              label="Category"
              value={formData.category}
              onChange={(value) => handleSelectChange("category", value)}
              options={categoryOptions}
              placeholder="Select a category"
              required
            />

            <SelectField
              id="model_dependency"
              label="Model Dependency"
              value={formData.model_dependency}
              onChange={(value) => handleSelectChange("model_dependency", value)}
              options={dependencyOptions}
              placeholder="Select dependency type"
              required
            />

            <FormField
              id="example_use_case"
              label="Example Use Case"
              type="textarea"
              value={formData.example_use_case}
              onChange={handleChange}
              placeholder="Describe an example use case"
              rows={3}
            />
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">↻</span>
                {isEditMode ? "Updating..." : "Creating..."}
              </span>
            ) : (
              <>{isEditMode ? "Update Technique" : "Create Technique"}</>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default TechniqueForm;
