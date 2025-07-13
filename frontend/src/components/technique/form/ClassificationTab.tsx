// src/components/technique/form/ClassificationTab.tsx
import React from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormSetValue,
} from "react-hook-form";
import { TechniqueFormData } from "@/lib/types";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface Option {
  value: string;
  label: string;
}

interface ClassificationTabProps {
  control: Control<TechniqueFormData>;
  errors: FieldErrors<TechniqueFormData>;
  setValue: UseFormSetValue<TechniqueFormData>;
  isLoading: boolean;
  assuranceGoalOptions: Option[];
  tagOptions: Option[];
  relatedTechniqueOptions: Option[];
}

export function ClassificationTab({
  control,
  errors,
  setValue,
  isLoading,
  assuranceGoalOptions,
  tagOptions,
  relatedTechniqueOptions,
}: ClassificationTabProps) {
  const handleGoalChange = (values: string[]) => {
    try {
      const goalIds = values.map((v) => parseInt(v));
      setValue("assurance_goal_ids", goalIds, { shouldValidate: true });
    } catch (error) {
      console.error("Error in handleGoalChange:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Classification</CardTitle>
        <CardDescription>
          Categorize the technique to make it easier to discover
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="assurance_goal_ids" className="block font-medium">
              Assurance Goals <span className="text-destructive">*</span>
            </label>
            <Controller
              name="assurance_goal_ids"
              control={control}
              render={({ field }) => (
                <select
                  id="assurance_goal_ids"
                  multiple
                  className="w-full px-3 py-2 border rounded-md"
                  onChange={(e) => {
                    const selectedOptions = Array.from(
                      e.target.selectedOptions,
                    ).map((opt) => opt.value);
                    handleGoalChange(selectedOptions);
                  }}
                  disabled={isLoading}
                  size={4}
                  value={field.value.map((id) => id.toString())}
                >
                  {assuranceGoalOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Hold Ctrl (or Cmd) to select multiple options
            </p>
            {errors?.assurance_goal_ids && (
              <p className="text-sm text-destructive">
                {errors.assurance_goal_ids.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="tag_ids" className="block font-medium">
              Tags
            </label>
            <Controller
              name="tag_ids"
              control={control}
              render={({ field }) => (
                <select
                  id="tag_ids"
                  multiple
                  className="w-full px-3 py-2 border rounded-md"
                  onChange={(e) => {
                    const selectedOptions = Array.from(
                      e.target.selectedOptions,
                    ).map((opt) => opt.value);
                    const tagIds = selectedOptions.map((v) => parseInt(v));
                    setValue("tag_ids", tagIds);
                  }}
                  disabled={isLoading}
                  size={8}
                  value={field.value.map((id) => id.toString())}
                >
                  {tagOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Hold Ctrl (or Cmd) to select multiple tags. Tags help categorize
              and filter techniques.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="related_technique_ids"
              className="block font-medium"
            >
              Related Techniques
            </label>
            <Controller
              name="related_technique_slugs"
              control={control}
              render={({ field }) => (
                <select
                  id="related_technique_ids"
                  multiple
                  className="w-full px-3 py-2 border rounded-md"
                  onChange={(e) => {
                    const selectedOptions = Array.from(
                      e.target.selectedOptions,
                    ).map((opt) => opt.value);
                    setValue("related_technique_slugs", selectedOptions);
                  }}
                  disabled={isLoading}
                  size={6}
                  value={field.value || []}
                >
                  {relatedTechniqueOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Hold Ctrl (or Cmd) to select multiple techniques that are related
              to this one.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
