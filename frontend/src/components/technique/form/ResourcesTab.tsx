// src/components/technique/form/ResourcesTab.tsx
import React from "react";
import { Resource } from "@/hooks/useDynamicArrays";

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

interface ResourcesTabProps {
  resources: Resource[];
  isLoading: boolean;
  resourceTypeOptions: Option[];
  addResource: () => void;
  updateResource: (
    index: number,
    field: keyof Resource,
    value: string | number,
  ) => void;
  removeResource: (index: number) => void;
}

export function ResourcesTab({
  resources,
  isLoading,
  resourceTypeOptions,
  addResource,
  updateResource,
  removeResource,
}: ResourcesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resources</CardTitle>
        <CardDescription>
          Add related resources, papers, and documentation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          {resources.map((resource, index) => (
            <div key={index} className="border p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Resource {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeResource(index)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`resource-type-${index}`}>Resource Type</Label>
                <select
                  id={`resource-type-${index}`}
                  value={resource.resource_type.toString()}
                  onChange={(e) =>
                    updateResource(
                      index,
                      "resource_type",
                      parseInt(e.target.value),
                    )
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={isLoading}
                >
                  <option value="0">Select resource type</option>
                  {resourceTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`resource-title-${index}`}>Title</Label>
                <Input
                  id={`resource-title-${index}`}
                  value={resource.title}
                  onChange={(e) =>
                    updateResource(index, "title", e.target.value)
                  }
                  placeholder="Enter resource title"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`resource-url-${index}`}>URL</Label>
                <Input
                  id={`resource-url-${index}`}
                  value={resource.url}
                  onChange={(e) => updateResource(index, "url", e.target.value)}
                  placeholder="Enter resource URL"
                  type="url"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`resource-description-${index}`}>
                  Description (Optional)
                </Label>
                <Textarea
                  id={`resource-description-${index}`}
                  value={resource.description}
                  onChange={(e) =>
                    updateResource(index, "description", e.target.value)
                  }
                  placeholder="Enter resource description"
                  rows={2}
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`resource-authors-${index}`}>
                    Authors (Optional)
                  </Label>
                  <Input
                    id={`resource-authors-${index}`}
                    value={resource.authors || ""}
                    onChange={(e) =>
                      updateResource(index, "authors", e.target.value)
                    }
                    placeholder="Enter authors"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`resource-publication-date-${index}`}>
                    Publication Date (Optional)
                  </Label>
                  <Input
                    id={`resource-publication-date-${index}`}
                    value={resource.publication_date || ""}
                    onChange={(e) =>
                      updateResource(index, "publication_date", e.target.value)
                    }
                    placeholder="e.g., 2023-01-15"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`resource-source-type-${index}`}>
                  Source Type (Optional)
                </Label>
                <Input
                  id={`resource-source-type-${index}`}
                  value={resource.source_type || ""}
                  onChange={(e) =>
                    updateResource(index, "source_type", e.target.value)
                  }
                  placeholder="e.g., technical_paper, tutorial, etc."
                  disabled={isLoading}
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addResource}
            disabled={isLoading}
            className="w-full"
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add Resource
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
