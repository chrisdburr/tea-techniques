# Frontend Migration Plan for TEA Techniques Project

This document outlines the plan to update the frontend of the TEA Techniques project to work with the new backend data model as defined in the requirements.

## 1. Overview of Changes

The frontend migration involves updating several key components to work with the new backend data structure:

1. **Update TypeScript Types**: Define new TypeScript interfaces to match the updated backend models.
2. **API Hooks**: Update hooks to work with new endpoints and data structures.
3. **Components**: Update UI components to handle the more complex data relationships.
4. **Forms**: Modify technique creation and editing forms to support the new data model.
5. **Technique Details View**: Enhance the technique details view to show additional information.

## 2. Detailed Implementation Plan

### 2.1 Update TypeScript Types

Update the type definitions in `/frontend/src/lib/types.ts`:

```typescript
// Updated Technique interface
export interface Technique {
  id: number;
  name: string;
  description: string;
  model_dependency: string;
  
  // Replace single values with arrays
  assurance_goals: AssuranceGoal[];
  categories: Category[];
  subcategories: SubCategory[];
  
  // New relationship data
  attributes: TechniqueAttribute[];
  resources: TechniqueResource[];
  example_use_cases: TechniqueExampleUseCase[];
  limitations: TechniqueLimitation[];
  tags: Tag[];
}

// New type definitions
export interface TechniqueAttribute {
  id: number;
  attribute_type: string;
  attribute_value: number;
  attribute_value_name: string;
}

export interface AttributeType {
  id: number;
  name: string;
  description: string;
  applicable_goals: number[];
  required_for_goals: number[];
}

export interface AttributeValue {
  id: number;
  attribute_type: number;
  attribute_type_name: string;
  name: string;
  description: string;
}

export interface TechniqueResource {
  id: number;
  resource_type: number;
  resource_type_name: string;
  title: string;
  url: string;
  description: string;
}

export interface ResourceType {
  id: number;
  name: string;
  icon: string;
}

export interface TechniqueExampleUseCase {
  id: number;
  description: string;
  assurance_goal?: number;
  assurance_goal_name?: string;
}

export interface TechniqueLimitation {
  id: number;
  description: string;
}

export interface SubCategory {
  id: number;
  name: string;
  description: string;
  category: number;
  category_name: string;
}

// For creating/updating techniques
export interface TechniqueFormData {
  name: string;
  description: string;
  model_dependency: string;
  assurance_goal_ids: number[];
  category_ids: number[];
  subcategory_ids: number[];
  tag_ids: number[];
  attributes: {
    attribute_type: number;
    attribute_value: number;
  }[];
  resources: {
    resource_type: number;
    title: string;
    url: string;
    description: string;
  }[];
  example_use_cases: {
    description: string;
    assurance_goal?: number;
  }[];
  limitations: string[];
}
```

### 2.2 Update API Hooks

Modify `/frontend/src/lib/api/hooks.ts` to work with the updated API endpoints:

```typescript
// New hooks for resources
export const useResourceTypes = () => {
  return useQuery({
    queryKey: ["resource-types"],
    queryFn: async () => {
      const response = await apiClient.get("/resourcetypes/");
      return response.data as APIResponse<ResourceType>;
    },
    refetchOnWindowFocus: false,
  });
};

// New hooks for attributes
export const useAttributeTypes = () => {
  return useQuery({
    queryKey: ["attribute-types"],
    queryFn: async () => {
      const response = await apiClient.get("/attributetypes/");
      return response.data as APIResponse<AttributeType>;
    },
    refetchOnWindowFocus: false,
  });
};

export const useAttributeValues = (attributeTypeId?: number) => {
  const params = attributeTypeId ? { attribute_type: attributeTypeId } : {};
  
  return useQuery({
    queryKey: ["attribute-values", attributeTypeId],
    queryFn: async () => {
      const response = await apiClient.get("/attributevalues/", { params });
      return response.data as APIResponse<AttributeValue>;
    },
    refetchOnWindowFocus: false,
    enabled: !!attributeTypeId, // Only run if attributeTypeId is provided
  });
};

// Update technique hooks
export const useCreateTechnique = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TechniqueFormData) => {
      const response = await apiClient.post("/techniques/", data);
      return response.data as Technique;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["techniques"] });
    },
  });
};

export const useUpdateTechnique = (id: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TechniqueFormData) => {
      const response = await apiClient.put(`/techniques/${id}/`, data);
      return response.data as Technique;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["techniques"] });
      queryClient.invalidateQueries({ queryKey: ["technique", id] });
    },
  });
};
```

### 2.3 Update TechniquesList Component

Update `/frontend/src/components/technique/TechniquesList.tsx` to display techniques with multiple goals and categories:

```tsx
// In TechniqueCard component
function TechniqueCard({ technique }: { technique: Technique }) {
  // Get first category and goal names for display in card
  const primaryCategory = technique.categories.length > 0 ? technique.categories[0].name : "Uncategorized";
  const primaryGoal = technique.assurance_goals.length > 0 ? technique.assurance_goals[0].name : undefined;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {technique.name}
        </CardTitle>
        <CardDescription>
          {primaryCategory} | {technique.model_dependency}
          {technique.assurance_goals.length > 1 && " | Multiple Goals"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {technique.description}
        </p>
        {primaryGoal && (
          <Badge variant="outline" className="mt-2">
            {primaryGoal}
          </Badge>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline">
          <Link href={`/techniques/${technique.id}`}>
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### 2.4 Update Technique Detail View

Update `/frontend/src/app/techniques/[id]/page.tsx` to show the additional technique information:

```tsx
// Sample code showing key sections that need updating
// Component to display technique attributes
function TechniqueAttributes({ attributes }: { attributes: TechniqueAttribute[] }) {
  // Group attributes by type
  const attributesByType = attributes.reduce((acc, attr) => {
    if (!acc[attr.attribute_type]) {
      acc[attr.attribute_type] = [];
    }
    acc[attr.attribute_type].push(attr);
    return acc;
  }, {} as Record<string, TechniqueAttribute[]>);
  
  return (
    <div className="space-y-4">
      {Object.entries(attributesByType).map(([type, attrs]) => (
        <div key={type} className="border rounded-md p-4">
          <h3 className="text-sm font-medium mb-2">{type}</h3>
          <div className="flex flex-wrap gap-2">
            {attrs.map((attr) => (
              <Badge key={attr.id} variant="secondary">
                {attr.attribute_value_name}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Component to display technique resources
function TechniqueResources({ resources }: { resources: TechniqueResource[] }) {
  return (
    <div className="space-y-2">
      {resources.map((resource) => (
        <div key={resource.id} className="border rounded-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">{resource.title}</h3>
              <p className="text-xs text-muted-foreground">{resource.resource_type_name}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                View Resource
              </a>
            </Button>
          </div>
          {resource.description && (
            <p className="text-sm mt-2">{resource.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// Component to display technique example use cases
function TechniqueExampleUseCases({ useCases }: { useCases: TechniqueExampleUseCase[] }) {
  return (
    <div className="space-y-2">
      {useCases.map((useCase) => (
        <div key={useCase.id} className="border rounded-md p-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium">Example Use Case</h3>
            {useCase.assurance_goal_name && (
              <Badge variant="outline" size="sm">
                {useCase.assurance_goal_name}
              </Badge>
            )}
          </div>
          <p className="text-sm">{useCase.description}</p>
        </div>
      ))}
    </div>
  );
}

// Component to display technique limitations
function TechniqueLimitations({ limitations }: { limitations: TechniqueLimitation[] }) {
  return (
    <div className="space-y-2">
      {limitations.map((limitation) => (
        <div key={limitation.id} className="border rounded-md p-4">
          <p className="text-sm">{limitation.description}</p>
        </div>
      ))}
    </div>
  );
}

// Main detail view component (partial)
export default function TechniqueDetailPage({ params }: { params: { id: string } }) {
  const { data: technique, isLoading, error } = useTechniqueDetail(Number(params.id));
  
  // Render technique details
  return (
    <MainLayout>
      {/* ... existing header code ... */}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="md:col-span-2 space-y-8">
          {/* Main content section */}
          <Section title="Description">
            <p>{technique.description}</p>
          </Section>
          
          <Section title="Example Use Cases">
            <TechniqueExampleUseCases useCases={technique.example_use_cases} />
          </Section>
          
          <Section title="Limitations">
            {technique.limitations.length > 0 ? (
              <TechniqueLimitations limitations={technique.limitations} />
            ) : (
              <p className="text-muted-foreground">No limitations specified.</p>
            )}
          </Section>
          
          <Section title="Resources">
            {technique.resources.length > 0 ? (
              <TechniqueResources resources={technique.resources} />
            ) : (
              <p className="text-muted-foreground">No resources available.</p>
            )}
          </Section>
        </div>
        
        <div className="space-y-6">
          {/* Sidebar with additional information */}
          <Card>
            <CardHeader>
              <CardTitle>Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoItem label="Model Dependency" value={technique.model_dependency} />
              
              <div>
                <h3 className="text-sm font-medium mb-2">Assurance Goals</h3>
                <div className="flex flex-wrap gap-2">
                  {technique.assurance_goals.map((goal) => (
                    <Badge key={goal.id} variant="default">
                      {goal.name}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {technique.categories.map((category) => (
                    <Badge key={category.id} variant="secondary">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {technique.subcategories.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Sub-Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {technique.subcategories.map((subcategory) => (
                      <Badge key={subcategory.id} variant="outline">
                        {subcategory.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Attributes</CardTitle>
            </CardHeader>
            <CardContent>
              {technique.attributes.length > 0 ? (
                <TechniqueAttributes attributes={technique.attributes} />
              ) : (
                <p className="text-muted-foreground">No attributes specified.</p>
              )}
            </CardContent>
          </Card>
          
          {technique.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {technique.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
```

### 2.5 Update Technique Form

Create a new, more comprehensive form component to handle the complex data structure:

```tsx
// src/components/technique/TechniqueForm.tsx
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useCreateTechnique,
  useUpdateTechnique,
  useAssuranceGoals,
  useCategories,
  useAttributeTypes,
  useAttributeValues,
  useResourceTypes,
} from "@/lib/api/hooks";
import { Technique, TechniqueFormData, AttributeType, AttributeValue, ResourceType } from "@/lib/types";
import { useForm } from "@/lib/hooks/useForm";
import { useApiError } from "@/lib/hooks/useApiError";
import { FormField } from "@/components/common/FormField";
import { SelectField } from "@/components/common/SelectField";
import { MultiSelectField } from "@/components/common/MultiSelectField";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";

interface TechniqueFormProps {
  technique?: Technique;
  isEditMode?: boolean;
}

// Initial form data
const initialFormData: TechniqueFormData = {
  name: "",
  description: "",
  model_dependency: "Model-Agnostic", // Default value
  assurance_goal_ids: [],
  category_ids: [],
  subcategory_ids: [],
  tag_ids: [],
  attributes: [],
  resources: [],
  example_use_cases: [],
  limitations: [],
};

// Form validators
const validators = {
  name: (value: string) => (!value.trim() ? "Name is required" : null),
  description: (value: string) => (!value.trim() ? "Description is required" : null),
  model_dependency: (value: string) => (!value ? "Model dependency is required" : null),
  assurance_goal_ids: (value: number[]) => (value.length === 0 ? "At least one assurance goal is required" : null),
  category_ids: (value: number[]) => (value.length === 0 ? "At least one category is required" : null),
  // Other fields are optional
};

const TechniqueForm: React.FC<TechniqueFormProps> = ({
  technique,
  isEditMode = false,
}) => {
  const router = useRouter();
  const { error: apiError, handleError } = useApiError();
  
  // State for managing dynamic arrays
  const [useCases, setUseCases] = useState<TechniqueFormData["example_use_cases"]>([{ description: "" }]);
  const [limitations, setLimitations] = useState<string[]>([""]);
  const [resources, setResources] = useState<TechniqueFormData["resources"]>([{ resource_type: 0, title: "", url: "", description: "" }]);
  
  // Set up form
  const {
    values: formData,
    errors,
    isSubmitting,
    handleChange,
    handleSelectChange,
    handleMultiSelectChange,
    setSubmitting,
    validateForm,
    resetForm,
    setFieldError,
    setFieldValue,
  } = useForm<TechniqueFormData>(initialFormData);

  // Fetch dropdown data
  const { data: assuranceGoalsData } = useAssuranceGoals();
  const { data: categoriesData } = useCategories();
  const { data: attributeTypesData } = useAttributeTypes();
  const { data: resourceTypesData } = useResourceTypes();
  
  // Filter categories by selected assurance goals
  // This is a critical step that maintains the hierarchical relationship
  // between goals and categories, where categories are specific to a single goal
  // (even if categories across different goals may share the same name)
  const filteredCategories = categoriesData?.results?.filter(
    (category) => formData.assurance_goal_ids.includes(category.assurance_goal)
  ) || [];
  
  // Set up mutations
  const createMutation = useCreateTechnique();
  const updateMutation = useUpdateTechnique(technique?.id || 0);
  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

  // Initialize form data when editing an existing technique
  useEffect(() => {
    if (isEditMode && technique) {
      // Prepare base form data
      const initialData = {
        name: technique.name || "",
        description: technique.description || "",
        model_dependency: technique.model_dependency || "Model-Agnostic",
        assurance_goal_ids: technique.assurance_goals.map(goal => goal.id),
        category_ids: technique.categories.map(cat => cat.id),
        subcategory_ids: technique.subcategories.map(subcat => subcat.id),
        tag_ids: technique.tags.map(tag => tag.id),
        attributes: technique.attributes.map(attr => ({
          attribute_type: parseInt(attr.attribute_type.toString()),
          attribute_value: attr.attribute_value
        })),
        resources: [],
        example_use_cases: [],
        limitations: [],
      };
      
      // Initialize dynamic arrays
      setUseCases(technique.example_use_cases.map(uc => ({
        description: uc.description,
        assurance_goal: uc.assurance_goal
      })));
      
      setLimitations(technique.limitations.map(lim => lim.description));
      
      setResources(technique.resources.map(res => ({
        resource_type: res.resource_type,
        title: res.title,
        url: res.url,
        description: res.description || ""
      })));
      
      resetForm(initialData);
    }
  }, [isEditMode, technique, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare final form data with dynamic arrays
    const finalFormData = {
      ...formData,
      example_use_cases: useCases.filter(uc => uc.description.trim() !== ""),
      limitations: limitations.filter(lim => lim.trim() !== ""),
      resources: resources.filter(res => res.title.trim() !== "" && res.url.trim() !== "")
    };

    if (!validateForm(validators)) {
      return;
    }

    setSubmitting(true);

    try {
      if (isEditMode && technique) {
        // Update existing technique
        const result = await updateMutation.mutateAsync(finalFormData);
        router.push(`/techniques/${result.id}`);
      } else {
        // Create new technique
        const result = await createMutation.mutateAsync(finalFormData);
        router.push(`/techniques/${result.id}`);
      }
    } catch (error) {
      handleError(error);
      setFieldError('submit', apiError?.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper functions for dynamic arrays
  const addUseCase = () => {
    setUseCases([...useCases, { description: "" }]);
  };

  const updateUseCase = (index: number, field: keyof TechniqueFormData["example_use_cases"][0], value: any) => {
    const updated = [...useCases];
    updated[index] = { ...updated[index], [field]: value };
    setUseCases(updated);
  };

  const removeUseCase = (index: number) => {
    setUseCases(useCases.filter((_, i) => i !== index));
  };

  const addLimitation = () => {
    setLimitations([...limitations, ""]);
  };

  const updateLimitation = (index: number, value: string) => {
    const updated = [...limitations];
    updated[index] = value;
    setLimitations(updated);
  };

  const removeLimitation = (index: number) => {
    setLimitations(limitations.filter((_, i) => i !== index));
  };

  const addResource = () => {
    setResources([...resources, { resource_type: 0, title: "", url: "", description: "" }]);
  };

  const updateResource = (index: number, field: keyof TechniqueFormData["resources"][0], value: any) => {
    const updated = [...resources];
    updated[index] = { ...updated[index], [field]: value };
    setResources(updated);
  };

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

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

  const resourceTypeOptions = resourceTypesData?.results?.map(rt => ({
    value: rt.id.toString(),
    label: rt.name,
  })) || [];

  return (
    <Card className="w-full mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>
            {isEditMode ? "Edit Technique" : "Add New Technique"}
          </CardTitle>
        </CardHeader>

        <Tabs defaultValue="basic">
          <div className="px-6">
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1">Basic Information</TabsTrigger>
              <TabsTrigger value="classification" className="flex-1">Classification</TabsTrigger>
              <TabsTrigger value="attributes" className="flex-1">Attributes</TabsTrigger>
              <TabsTrigger value="resources" className="flex-1">Resources</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="basic" className="p-6 space-y-6">
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
              id="model_dependency"
              label="Model Dependency"
              value={formData.model_dependency}
              onChange={(value) => handleSelectChange("model_dependency", value)}
              options={dependencyOptions}
              placeholder="Select dependency type"
              required
            />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Example Use Cases</h3>
              {useCases.map((useCase, index) => (
                <div key={index} className="border rounded-md p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Example {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUseCase(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <FormField
                    id={`useCase-${index}`}
                    label="Description"
                    type="textarea"
                    value={useCase.description}
                    onChange={(e) => updateUseCase(index, "description", e.target.value)}
                    placeholder="Describe an example use case"
                    rows={3}
                  />
                  
                  <SelectField
                    id={`useCase-goal-${index}`}
                    label="Related Assurance Goal (Optional)"
                    value={useCase.assurance_goal?.toString() || ""}
                    onChange={(value) => updateUseCase(index, "assurance_goal", value ? parseInt(value) : undefined)}
                    options={assuranceGoalOptions}
                    placeholder="Select related goal (optional)"
                    required={false}
                  />
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addUseCase}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Use Case
              </Button>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Limitations</h3>
              {limitations.map((limitation, index) => (
                <div key={index} className="border rounded-md p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Limitation {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLimitation(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <FormField
                    id={`limitation-${index}`}
                    label="Description"
                    type="textarea"
                    value={limitation}
                    onChange={(e) => updateLimitation(index, e.target.value)}
                    placeholder="Describe a limitation of this technique"
                    rows={3}
                  />
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addLimitation}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Limitation
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="classification" className="p-6 space-y-6">
            <MultiSelectField
              id="assurance_goal_ids"
              label="Assurance Goals"
              values={formData.assurance_goal_ids.map(id => id.toString())}
              onChange={(values) => {
                // Convert string IDs to numbers
                const numericIds = values.map(v => parseInt(v));
                handleMultiSelectChange("assurance_goal_ids", numericIds);
              }}
              options={assuranceGoalOptions}
              placeholder="Select assurance goals"
              error={errors.assurance_goal_ids}
              required
            />
            
            <MultiSelectField
              id="category_ids"
              label="Categories"
              values={formData.category_ids.map(id => id.toString())}
              onChange={(values) => {
                // Convert string IDs to numbers
                const numericIds = values.map(v => parseInt(v));
                handleMultiSelectChange("category_ids", numericIds);
              }}
              options={categoryOptions}
              placeholder="Select categories"
              error={errors.category_ids}
              required
            />
            
            {/* Add subcategories and tags selection here */}
          </TabsContent>
          
          <TabsContent value="attributes" className="p-6 space-y-6">
            {/* Attribute management UI */}
            <p className="text-sm text-muted-foreground">
              Add attributes like Scope, Fairness Approach, etc. to better classify this technique.
            </p>
            
            {/* Add attribute management UI here */}
          </TabsContent>
          
          <TabsContent value="resources" className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Related Resources</h3>
              {resources.map((resource, index) => (
                <div key={index} className="border rounded-md p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Resource {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeResource(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <SelectField
                    id={`resource-type-${index}`}
                    label="Resource Type"
                    value={resource.resource_type.toString()}
                    onChange={(value) => updateResource(index, "resource_type", parseInt(value))}
                    options={resourceTypeOptions}
                    placeholder="Select resource type"
                  />
                  
                  <FormField
                    id={`resource-title-${index}`}
                    label="Title"
                    value={resource.title}
                    onChange={(e) => updateResource(index, "title", e.target.value)}
                    placeholder="Enter resource title"
                  />
                  
                  <FormField
                    id={`resource-url-${index}`}
                    label="URL"
                    value={resource.url}
                    onChange={(e) => updateResource(index, "url", e.target.value)}
                    placeholder="Enter resource URL"
                  />
                  
                  <FormField
                    id={`resource-description-${index}`}
                    label="Description (Optional)"
                    value={resource.description}
                    onChange={(e) => updateResource(index, "description", e.target.value)}
                    placeholder="Enter resource description"
                  />
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addResource}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Resource
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-between p-6">
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
```

### 2.6 Create Additional Form Components

Create a new multi-select component:

```tsx
// src/components/common/MultiSelectField.tsx
import React from "react";
import { CheckIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectFieldProps {
  id: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: Option[];
  placeholder?: string;
  description?: string;
  error?: string | null;
  required?: boolean;
}

export const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  id,
  label,
  values,
  onChange,
  options,
  placeholder = "Select options",
  description,
  error,
  required = false,
}) => {
  const handleSelect = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const handleRemove = (value: string) => {
    onChange(values.filter((v) => v !== value));
  };

  const selectedLabels = values.map(
    (value) => options.find((option) => option.value === value)?.label || value
  );

  return (
    <FormItem>
      <FormLabel htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </FormLabel>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between",
              !values.length && "text-muted-foreground"
            )}
          >
            {values.length > 0
              ? `${values.length} selected`
              : placeholder}
            <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
            <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      values.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedLabels.map((label, i) => (
            <Badge key={i} variant="secondary" className="mr-1 mb-1">
              {label}
              <button
                type="button"
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={() => handleRemove(values[i])}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      {description && <FormDescription>{description}</FormDescription>}
      {error && <FormMessage>{error}</FormMessage>}
    </FormItem>
  );
};
```

## 3. Testing Plan

1. **Component Tests**:
   - Create tests for updated components
   - Verify rendering with new data structure
   - Test form interactions

2. **Integration Tests**:
   - Test API interactions with updated backend
   - Test form submissions with complex data
   - Test validation logic
   - Verify category filtering properly maintains hierarchical relationships

3. **E2E Tests**:
   - Test complete user flows from listing to creation to editing
   - Test proper filtering of categories based on selected goals
   - Verify users can't associate categories with incorrect goals

## 4. Rollout Strategy

1. **Development Phase**:
   - Update TypeScript types
   - Implement updated hooks
   - Update UI components
   - Develop improved forms

2. **Testing Phase**:
   - Run component tests
   - Test with updated backend
   - Perform manual testing

3. **Deployment**:
   - Deploy after backend migration is complete
   - Monitor for errors
   - Address any issues that arise

## 5. Timeline

1. Development: 2 weeks
2. Testing: 1 week
3. Deployment: 1 day
4. Post-deployment fixes: 1 week

Total estimated time: 3-4 weeks, aligned with backend migration timeline.