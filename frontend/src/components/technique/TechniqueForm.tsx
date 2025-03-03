// src/components/technique/TechniqueForm.tsx
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useCreateTechnique,
  useUpdateTechnique,
  useAssuranceGoals,
  useCategories,
  useSubCategories,
  useTags,
  useResourceTypes,
  useTechniqueDetail,
} from "@/lib/api/hooks";
import { 
  TechniqueFormData
} from "@/lib/types";
import { useForm } from "@/lib/hooks/useForm";
import { useApiError } from "@/lib/hooks/useApiError";
import { SelectField } from "@/components/common/SelectField";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2, ArrowLeft, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

interface TechniqueFormProps {
  id?: number;
  isEditMode?: boolean;
}

export default function TechniqueForm({ id, isEditMode = false }: TechniqueFormProps) {
  const router = useRouter();
  
  // Form state management
  const {
    values: formData,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    validateForm,
    resetForm,
  } = useForm<TechniqueFormData>(initialFormData, validators);

  const { error: apiError, handleError } = useApiError();

  // State for dynamic arrays
  const [useCases, setUseCases] = useState<Array<{ description: string; assurance_goal?: number }>>([{ description: "" }]);
  const [limitations, setLimitations] = useState<string[]>([""]);
  const [resources, setResources] = useState<Array<{ resource_type: number; title: string; url: string; description: string }>>([
    { resource_type: 0, title: "", url: "", description: "" }
  ]);

  // Fetch technique details if in edit mode
  const { data: techniqueData, isLoading: isLoadingTechnique } = useTechniqueDetail(id || 0);

  // Fetch reference data
  const { data: assuranceGoalsData, isLoading: isLoadingGoals } = useAssuranceGoals();
  const { data: tagsData, isLoading: isLoadingTags } = useTags();
  const { data: resourceTypesData, isLoading: isLoadingResourceTypes } = useResourceTypes();
  
  // Fetch categories filtered by selected assurance goals
  const [selectedGoals, setSelectedGoals] = useState<number[]>([]);
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories();
  
  // Filter categories to only show those belonging to selected goals
  const filteredCategories = categoriesData?.results
    ? categoriesData.results.filter(cat => 
        selectedGoals.length === 0 || selectedGoals.includes(cat.assurance_goal)
      )
    : [];
  
  // Fetch subcategories filtered by selected categories
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const { data: subcategoriesData } = useSubCategories();
  
  // Filter subcategories to only show those belonging to selected categories
  const filteredSubcategories = subcategoriesData?.results
    ? subcategoriesData.results.filter(subcat => 
        selectedCategories.length === 0 || selectedCategories.includes(subcat.category)
      )
    : [];

  // Mutations for create/update
  const createMutation = useCreateTechnique();
  const updateMutation = useUpdateTechnique(id || 0);
  
  // Track overall loading state
  const isLoading = 
    isLoadingGoals || 
    isLoadingCategories || 
    isLoadingTags || 
    isLoadingResourceTypes ||
    (isEditMode && isLoadingTechnique) ||
    isSubmitting ||
    createMutation.isPending ||
    updateMutation.isPending;

  // Initialize form when editing
  useEffect(() => {
    if (isEditMode && techniqueData) {
      // Extract IDs from relationships
      const assurance_goal_ids = techniqueData.assurance_goals.map(goal => goal.id);
      const category_ids = techniqueData.categories.map(cat => cat.id);
      const subcategory_ids = techniqueData.subcategories.map(subcat => subcat.id);
      const tag_ids = techniqueData.tags.map(tag => tag.id);
      
      // Format attributes
      const attributes = techniqueData.attributes.map(attr => ({
        attribute_type: typeof attr.attribute_type === 'string' 
          ? parseInt(attr.attribute_type) 
          : attr.attribute_type,
        attribute_value: attr.attribute_value
      }));
      
      // Set state for dynamic arrays
      setUseCases(techniqueData.example_use_cases.length > 0 
        ? techniqueData.example_use_cases.map(uc => ({
            description: uc.description,
            assurance_goal: uc.assurance_goal
          }))
        : [{ description: "" }]
      );
      
      setLimitations(techniqueData.limitations.length > 0
        ? techniqueData.limitations.map(lim => lim.description)
        : [""]
      );
      
      setResources(techniqueData.resources.length > 0
        ? techniqueData.resources.map(res => ({
            resource_type: res.resource_type,
            title: res.title,
            url: res.url,
            description: res.description
          }))
        : [{ resource_type: 0, title: "", url: "", description: "" }]
      );
      
      // Update form values using resetForm
      resetForm({
        name: techniqueData.name,
        description: techniqueData.description,
        model_dependency: techniqueData.model_dependency,
        assurance_goal_ids,
        category_ids,
        subcategory_ids,
        tag_ids,
        attributes,
        resources: [], // Will be handled by resources state
        example_use_cases: [], // Will be handled by useCases state
        limitations: [], // Will be handled by limitations state
      });
      
      // Update selected goals/categories for filtering, directly instead of through effects
      setSelectedGoals([...assurance_goal_ids]); // Use a new array to prevent reference sharing
      setSelectedCategories([...category_ids]);
    }
  }, [isEditMode, techniqueData, resetForm]);

  // Make sure selectedGoals and selectedCategories are memoized based on form data
  // without creating effects that might cause infinite loops
  const memoizedSelectedGoals = React.useMemo(() => formData.assurance_goal_ids, [formData.assurance_goal_ids]);
  const memoizedSelectedCategories = React.useMemo(() => formData.category_ids, [formData.category_ids]);
  
  // Update selected goals/categories with memoized values - only runs once after memo values are computed
  React.useEffect(() => {
    // Use functional updates to avoid potential loops
    setSelectedGoals(() => memoizedSelectedGoals);
  }, [memoizedSelectedGoals]);
  
  React.useEffect(() => {
    // Use functional updates to avoid potential loops
    setSelectedCategories(() => memoizedSelectedCategories);
  }, [memoizedSelectedCategories]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty entries from dynamic arrays
    const filteredUseCases = useCases.filter(uc => uc.description.trim() !== "");
    const filteredLimitations = limitations.filter(lim => lim.trim() !== "");
    const filteredResources = resources.filter(res => res.title.trim() !== "" && res.url.trim() !== "");
    
    // Create final form data
    const finalFormData: TechniqueFormData = {
      ...formData,
      example_use_cases: filteredUseCases,
      limitations: filteredLimitations,
      resources: filteredResources,
    };
    
    // Validate the form
    const isValid = validateForm();
    if (!isValid) {
      // Show error message
      console.error("Form validation failed", errors);
      return;
    }
    
    try {
      if (isEditMode && id) {
        // Update existing technique
        await updateMutation.mutateAsync(finalFormData);
        router.push(`/techniques/${id}`);
      } else {
        // Create new technique
        const result = await createMutation.mutateAsync(finalFormData);
        router.push(`/techniques/${result.id}`);
      }
    } catch (error) {
      console.error("Error submitting technique:", error);
      handleError(error);
      setFieldError('submit', apiError?.message || 'An unexpected error occurred');
    }
  };

  // Handle goal selection changes - simplified to avoid cascading effects
  const handleGoalChange = (values: string[]) => {
    try {
      // Just update the form field directly, don't do cascading updates here
      const goalIds = values.map(v => parseInt(v));
      setFieldValue("assurance_goal_ids", goalIds);
      
      // Instead of setting other fields here, let the initial form load handle it
      // this helps break the circular deps
    } catch (error) {
      console.error("Error in handleGoalChange:", error);
    }
  };

  // Handle category selection changes - simplified to prevent effects loop
  const handleCategoryChange = (values: string[]) => {
    try {
      // Just update the field directly, no cascading
      const categoryIds = values.map(v => parseInt(v));
      setFieldValue("category_ids", categoryIds);
      
      // Don't update subcategories here to avoid circular deps
    } catch (error) {
      console.error("Error in handleCategoryChange:", error);
    }
  };

  // Dynamic array management functions
  const addUseCase = () => {
    setUseCases([...useCases, { description: "" }]);
  };

  const updateUseCase = (index: number, field: keyof typeof useCases[0], value: string | number | undefined) => {
    const updated = [...useCases];
    updated[index] = { ...updated[index], [field]: value };
    setUseCases(updated);
  };

  const removeUseCase = (index: number) => {
    if (useCases.length > 1) {
      setUseCases(useCases.filter((_, i) => i !== index));
    } else {
      setUseCases([{ description: "" }]);
    }
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
    if (limitations.length > 1) {
      setLimitations(limitations.filter((_, i) => i !== index));
    } else {
      setLimitations([""]);
    }
  };

  const addResource = () => {
    setResources([...resources, { resource_type: 0, title: "", url: "", description: "" }]);
  };

  const updateResource = (index: number, field: keyof typeof resources[0], value: string | number) => {
    const updated = [...resources];
    updated[index] = { ...updated[index], [field]: value };
    setResources(updated);
  };

  const removeResource = (index: number) => {
    if (resources.length > 1) {
      setResources(resources.filter((_, i) => i !== index));
    } else {
      setResources([{ resource_type: 0, title: "", url: "", description: "" }]);
    }
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

  const subcategoryOptions = filteredSubcategories.map(subcategory => ({
    value: subcategory.id.toString(),
    label: subcategory.name,
  }));

  const tagOptions = tagsData?.results?.map(tag => ({
    value: tag.id.toString(),
    label: tag.name,
  })) || [];

  const modelDependencyOptions = [
    { value: "Model-Agnostic", label: "Model-Agnostic" },
    { value: "Model-Specific", label: "Model-Specific" },
  ];

  const resourceTypeOptions = resourceTypesData?.results?.map(rt => ({
    value: rt.id.toString(),
    label: rt.name,
  })) || [];

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">
            {isEditMode ? "Edit Technique" : "Create New Technique"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode
              ? "Update this technique with new information"
              : "Add a new technique to the collection"}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="classification">Classification</TabsTrigger>
            <TabsTrigger value="examples">Examples & Limitations</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic">
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
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter technique name"
                    disabled={isLoading}
                  />
                  {errors?.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Provide a detailed description of the technique"
                    rows={6}
                    disabled={isLoading}
                  />
                  {errors?.description && (
                    <p className="text-sm text-destructive">{errors.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model_dependency">
                    Model Dependency <span className="text-destructive">*</span>
                  </Label>
                  {/* Temporary fix: Use native select instead of SelectField */}
                  <select
                    id="model_dependency"
                    name="model_dependency"
                    value={formData.model_dependency}
                    onChange={(e) => setFieldValue("model_dependency", e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="" disabled>Select Model Dependency</option>
                    {modelDependencyOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {errors?.model_dependency && (
                    <p className="text-sm text-destructive">{errors.model_dependency}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classification Tab */}
          <TabsContent value="classification">
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
                    <select
                      id="assurance_goal_ids"
                      multiple
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.assurance_goal_ids.map(id => id.toString())}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
                        handleGoalChange(selectedOptions);
                      }}
                      disabled={isLoading}
                      size={4}
                    >
                      {assuranceGoalOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Hold Ctrl (or Cmd) to select multiple options
                    </p>
                    {errors?.assurance_goal_ids && (
                      <p className="text-sm text-destructive">{errors.assurance_goal_ids}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="category_ids" className="block font-medium">
                      Categories <span className="text-destructive">*</span>
                    </label>
                    <select
                      id="category_ids"
                      multiple
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.category_ids.map(id => id.toString())}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
                        handleCategoryChange(selectedOptions);
                      }}
                      disabled={isLoading || formData.assurance_goal_ids.length === 0}
                      size={4}
                    >
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      {formData.assurance_goal_ids.length === 0 
                        ? "Select assurance goals first to see available categories" 
                        : "Hold Ctrl (or Cmd) to select multiple options"}
                    </p>
                    {errors?.category_ids && (
                      <p className="text-sm text-destructive">{errors.category_ids}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subcategory_ids" className="block font-medium">
                      Subcategories
                    </label>
                    <select
                      id="subcategory_ids"
                      multiple
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.subcategory_ids.map(id => id.toString())}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
                        const subcategoryIds = selectedOptions.map(v => parseInt(v));
                        setFieldValue("subcategory_ids", subcategoryIds);
                      }}
                      disabled={isLoading || formData.category_ids.length === 0}
                      size={4}
                    >
                      {subcategoryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      {formData.category_ids.length === 0 
                        ? "Select categories first to see available subcategories" 
                        : "Hold Ctrl (or Cmd) to select multiple options"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="tag_ids" className="block font-medium">
                      Tags
                    </label>
                    <select
                      id="tag_ids"
                      multiple
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.tag_ids.map(id => id.toString())}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
                        const tagIds = selectedOptions.map(v => parseInt(v));
                        setFieldValue("tag_ids", tagIds);
                      }}
                      disabled={isLoading}
                      size={4}
                    >
                      {tagOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Hold Ctrl (or Cmd) to select multiple options
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Examples & Limitations Tab */}
          <TabsContent value="examples">
            <Card>
              <CardHeader>
                <CardTitle>Example Use Cases</CardTitle>
                <CardDescription>
                  Provide examples of how this technique can be used
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {useCases.map((useCase, index) => (
                    <div key={index} className="border rounded-md p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">Example {index + 1}</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUseCase(index)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`useCase-description-${index}`}>Description</Label>
                        <Textarea
                          id={`useCase-description-${index}`}
                          value={useCase.description}
                          onChange={(e) => updateUseCase(index, "description", e.target.value)}
                          placeholder="Describe an example use case"
                          rows={3}
                          disabled={isLoading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`useCase-goal-${index}`}>Related Assurance Goal (Optional)</Label>
                        <SelectField
                          id={`useCase-goal-${index}`}
                          label=""
                          value={useCase.assurance_goal?.toString() || "0"}
                          onChange={(value) => updateUseCase(index, "assurance_goal", value === "0" ? undefined : parseInt(value))}
                          options={[{ value: "0", label: "None" }, ...assuranceGoalOptions]}
                          placeholder="Select related goal (optional)"
                          disabled={isLoading}
                        />
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
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Limitations</CardTitle>
                <CardDescription>
                  Outline any limitations or drawbacks of this technique
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {limitations.map((limitation, index) => (
                    <div key={index} className="border rounded-md p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">Limitation {index + 1}</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLimitation(index)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`limitation-${index}`}>Description</Label>
                        <Textarea
                          id={`limitation-${index}`}
                          value={limitation}
                          onChange={(e) => updateLimitation(index, e.target.value)}
                          placeholder="Describe a limitation of this technique"
                          rows={3}
                          disabled={isLoading}
                        />
                      </div>
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
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <CardTitle>Resources</CardTitle>
                <CardDescription>
                  Add links to papers, code repositories, documentation, or other related resources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resources.map((resource, index) => (
                    <div key={index} className="border rounded-md p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">Resource {index + 1}</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeResource(index)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`resource-type-${index}`}>Resource Type</Label>
                        <SelectField
                          id={`resource-type-${index}`}
                          label=""
                          value={resource.resource_type ? resource.resource_type.toString() : ""}
                          onChange={(value) => updateResource(index, "resource_type", parseInt(value))}
                          options={[{ value: "", label: "Select resource type" }, ...resourceTypeOptions]}
                          placeholder="Select resource type"
                          disabled={isLoading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`resource-title-${index}`}>Title</Label>
                        <Input
                          id={`resource-title-${index}`}
                          value={resource.title}
                          onChange={(e) => updateResource(index, "title", e.target.value)}
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
                        <Label htmlFor={`resource-description-${index}`}>Description (Optional)</Label>
                        <Textarea
                          id={`resource-description-${index}`}
                          value={resource.description}
                          onChange={(e) => updateResource(index, "description", e.target.value)}
                          placeholder="Enter resource description"
                          rows={2}
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
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">↻</span>
                {isEditMode ? "Updating..." : "Creating..."}
              </span>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditMode ? "Update Technique" : "Create Technique"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}