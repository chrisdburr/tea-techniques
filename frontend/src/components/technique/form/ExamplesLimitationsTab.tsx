// src/components/technique/form/ExamplesLimitationsTab.tsx
import React from "react";
import { UseCase } from "@/hooks/useDynamicArrays";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2 } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface ExamplesLimitationsTabProps {
  useCases: UseCase[];
  limitations: string[];
  isLoading: boolean;
  assuranceGoalOptions: Option[];
  addUseCase: () => void;
  updateUseCase: (index: number, field: keyof UseCase, value: string | number | undefined) => void;
  removeUseCase: (index: number) => void;
  addLimitation: () => void;
  updateLimitation: (index: number, value: string) => void;
  removeLimitation: (index: number) => void;
}

export function ExamplesLimitationsTab({
  useCases,
  limitations,
  isLoading,
  assuranceGoalOptions,
  addUseCase,
  updateUseCase,
  removeUseCase,
  addLimitation,
  updateLimitation,
  removeLimitation,
}: ExamplesLimitationsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Examples & Limitations</CardTitle>
        <CardDescription>
          Provide use cases and limitations for this technique
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Example Use Cases Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Example Use Cases</h3>
          
          {useCases.map((useCase, index) => (
            <div key={index} className="border p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Use Case {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeUseCase(index)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`usecase-description-${index}`}>Description</Label>
                <Textarea
                  id={`usecase-description-${index}`}
                  value={useCase.description}
                  onChange={(e) => updateUseCase(index, "description", e.target.value)}
                  placeholder="Describe how this technique can be used"
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`usecase-goal-${index}`}>Assurance Goal (Optional)</Label>
                <select
                  id={`usecase-goal-${index}`}
                  value={useCase.assurance_goal?.toString() || ""}
                  onChange={(e) => updateUseCase(index, "assurance_goal", e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={isLoading}
                >
                  <option value="">Select a goal</option>
                  {assuranceGoalOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addUseCase}
            disabled={isLoading}
            className="w-full"
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add Use Case
          </Button>
        </div>

        {/* Limitations Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Limitations</h3>
          
          {limitations.map((limitation, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`limitation-${index}`}>Limitation {index + 1}</Label>
                <Textarea
                  id={`limitation-${index}`}
                  value={limitation}
                  onChange={(e) => updateLimitation(index, e.target.value)}
                  placeholder="Describe a limitation of this technique"
                  rows={2}
                  disabled={isLoading}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeLimitation(index)}
                disabled={isLoading}
                className="mt-7"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addLimitation}
            disabled={isLoading}
            className="w-full"
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add Limitation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}