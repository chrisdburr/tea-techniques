// src/components/technique/form/BasicInfoTab.tsx
import React from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { TechniqueFormData } from "@/lib/types";
import { ratingOptions } from "./schema";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BasicInfoTabProps {
  control: Control<TechniqueFormData>;
  errors: FieldErrors<TechniqueFormData>;
  isLoading: boolean;
}

export function BasicInfoTab({ control, errors, isLoading }: BasicInfoTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>
          Provide essential information about the technique
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">
            Technique Name <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                id="name"
                placeholder="Enter technique name"
                disabled={isLoading}
                {...field}
              />
            )}
          />
          {errors?.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                id="description"
                placeholder="Provide a detailed description of the technique"
                rows={6}
                disabled={isLoading}
                {...field}
              />
            )}
          />
          {errors?.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="complexity_rating">
              Complexity Rating
            </Label>
            <Controller
              name="complexity_rating"
              control={control}
              render={({ field }) => (
                <select
                  id="complexity_rating"
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={isLoading}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  value={field.value?.toString() || ""}
                >
                  {ratingOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="computational_cost_rating">
              Computational Cost Rating
            </Label>
            <Controller
              name="computational_cost_rating"
              control={control}
              render={({ field }) => (
                <select
                  id="computational_cost_rating"
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={isLoading}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  value={field.value?.toString() || ""}
                >
                  {ratingOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}