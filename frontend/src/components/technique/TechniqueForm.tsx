// src/components/technique/TechniqueForm.tsx
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useCreateTechnique,
  useUpdateTechnique,
  useAssuranceGoals,
  useTags,
  useResourceTypes,
  useTechniqueDetail,
  useTechniques,
} from "@/lib/api/hooks";
import {
  TechniqueFormData,
  Technique
} from "@/lib/types";
import { useApiError } from "@/lib/hooks/useApiError";
import { SelectField } from "@/components/common/SelectField";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
  complexity_rating: undefined,
  computational_cost_rating: undefined,
  assurance_goal_ids: [],
  tag_ids: [],
  related_technique_slugs: [],
  resources: [],
  example_use_cases: [],
  limitations: [],
};

// Zod schema for form validation
const techniqueSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  complexity_rating: z.number().min(1).max(5).optional(),
  computational_cost_rating: z.number().min(1).max(5).optional(),
  assurance_goal_ids: z.array(z.number()).min(1, { message: "At least one assurance goal is required" }),
  tag_ids: z.array(z.number()),
  related_technique_slugs: z.array(z.string()),
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

interface TechniqueFormProps {
  slug?: string;
  isEditMode?: boolean;
}

export default function TechniqueForm({ slug, isEditMode = false }: TechniqueFormProps) {
  const router = useRouter();

  // Form state management with react-hook-form
  const {
    control,
    handleSubmit: hookFormSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset
  } = useForm<TechniqueFormData>({
    resolver: zodResolver(techniqueSchema),
    defaultValues: initialFormData,
    mode: "onBlur"
  });

  // Watch relevant fields for dependent selections
  // const watchedAssuranceGoalIds = watch("assurance_goal_ids");
  // const watchedTagIds = watch("tag_ids");

  const { handleError } = useApiError();

  // State for dynamic arrays
  const [useCases, setUseCases] = useState<Array<{ description: string; assurance_goal?: number }>>([{ description: "" }]);
  const [limitations, setLimitations] = useState<string[]>([""]);
  const [resources, setResources] = useState<Array<{ resource_type: number; title: string; url: string; description: string; authors?: string; publication_date?: string; source_type?: string }>>([
    { resource_type: 0, title: "", url: "", description: "", authors: "", publication_date: "", source_type: "" }
  ]);

  // Fetch technique details if in edit mode
  const { data: techniqueData, isLoading: isLoadingTechnique } = useTechniqueDetail(slug || "");

  // Fetch reference data
  const { data: assuranceGoalsData, isLoading: isLoadingGoals } = useAssuranceGoals();
  const { data: tagsData, isLoading: isLoadingTags } = useTags();
  const { data: resourceTypesData, isLoading: isLoadingResourceTypes } = useResourceTypes();

  // Fetch all techniques for related techniques selection
  const { data: techniquesData, isLoading: isLoadingTechniques } = useTechniques();

  // Mutations for create/update
  const createMutation = useCreateTechnique();
  const updateMutation = useUpdateTechnique(slug || "");

  // Track overall loading state
  // Track overall loading state
  const isLoading =
    isLoadingGoals ||
    isLoadingTags ||
    isLoadingResourceTypes ||
    isLoadingTechniques ||
    (isEditMode && isLoadingTechnique) ||
    isSubmitting ||
    createMutation.isPending ||
    updateMutation.isPending;

  // Initialize form when editing
  useEffect(() => {
    if (isEditMode && techniqueData) {
      // Extract IDs from relationships
      const assurance_goal_ids = techniqueData.assurance_goals.map(goal => goal.id);
      const tag_ids = techniqueData.tags.map(tag => tag.id);
      const related_technique_slugs = techniqueData.related_techniques || [];


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
          description: res.description,
          authors: res.authors || "",
          publication_date: res.publication_date || "",
          source_type: res.source_type || ""
        }))
        : [{ resource_type: 0, title: "", url: "", description: "" }]
      );

      // Update form values using react-hook-form's reset
      reset({
        name: techniqueData.name,
        description: techniqueData.description,
        complexity_rating: techniqueData.complexity_rating,
        computational_cost_rating: techniqueData.computational_cost_rating,
        assurance_goal_ids,
        tag_ids,
        related_technique_slugs,
        resources: [], // Will be handled by resources state
        example_use_cases: [], // Will be handled by useCases state
        limitations: [], // Will be handled by limitations state
      });
    }
  }, [isEditMode, techniqueData, reset]);

  // Handle form submission using react-hook-form
  const onSubmit: SubmitHandler<TechniqueFormData> = async (data) => {
    // Filter out empty entries from dynamic arrays
    const filteredUseCases = useCases.filter(uc => uc.description.trim() !== "");
    const filteredLimitations = limitations.filter(lim => lim.trim() !== "");
    const filteredResources = resources.filter(res => res.title.trim() !== "" && res.url.trim() !== "");

    // Create final form data
    const finalFormData: TechniqueFormData = {
      ...data,
      example_use_cases: filteredUseCases,
      limitations: filteredLimitations,
      resources: filteredResources,
    };

    try {
      if (isEditMode && slug) {
        // Update existing technique
        await updateMutation.mutateAsync(finalFormData);
        router.push(`/techniques/${slug}`);
      } else {
        // Create new technique
        const result = await createMutation.mutateAsync(finalFormData);
        // Add a null check to handle the case when result might be null
        if (result && result.slug) {
          router.push(`/techniques/${result.slug}`);
        } else {
          // Fallback if result or result.slug is null
          router.push(`/techniques`);
          console.warn("Received null or invalid result from API");
        }
      }
    } catch (error) {
      console.error("Error submitting technique:", error);
      handleError(error);
    }
  };

  // Handle goal selection changes with react-hook-form
  const handleGoalChange = (values: string[]) => {
    try {
      // Use setValue from react-hook-form
      const goalIds = values.map(v => parseInt(v));
      setValue("assurance_goal_ids", goalIds, { shouldValidate: true });
    } catch (error) {
      console.error("Error in handleGoalChange:", error);
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
    setResources([...resources, { resource_type: 0, title: "", url: "", description: "", authors: "", publication_date: "", source_type: "" }]);
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
      setResources([{ resource_type: 0, title: "", url: "", description: "", authors: "", publication_date: "", source_type: "" }]);
    }
  };

  // Prepare options for select fields
  const assuranceGoalOptions = assuranceGoalsData?.results?.map(goal => ({
    value: goal.id.toString(),
    label: goal.name,
  })) || [];

  const tagOptions = tagsData?.results?.map(tag => ({
    value: tag.id.toString(),
    label: tag.name,
  })) || [];

  const relatedTechniqueOptions = techniquesData?.results
    ?.filter((t: Technique) => t.slug !== slug) // Don't show current technique as option
    ?.map((technique: Technique) => ({
      value: technique.slug,
      label: technique.name,
    })) || [];

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

      <form onSubmit={hookFormSubmit(onSubmit)}>
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
                          <option value="">Select rating</option>
                          <option value="1">1 - Very Low</option>
                          <option value="2">2 - Low</option>
                          <option value="3">3 - Medium</option>
                          <option value="4">4 - High</option>
                          <option value="5">5 - Very High</option>
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
                          <option value="">Select rating</option>
                          <option value="1">1 - Very Low</option>
                          <option value="2">2 - Low</option>
                          <option value="3">3 - Medium</option>
                          <option value="4">4 - High</option>
                          <option value="5">5 - Very High</option>
                        </select>
                      )}
                    />
                  </div>
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
                    <Controller
                      name="assurance_goal_ids"
                      control={control}
                      render={({ field }) => (
                        <select
                          id="assurance_goal_ids"
                          multiple
                          className="w-full px-3 py-2 border rounded-md"
                          onChange={(e) => {
                            const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
                            handleGoalChange(selectedOptions);
                          }}
                          disabled={isLoading}
                          size={4}
                          value={field.value.map(id => id.toString())}
                        >
                          {assuranceGoalOptions.map(option => (
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
                      <p className="text-sm text-destructive">{errors.assurance_goal_ids.message}</p>
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
                            const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
                            const tagIds = selectedOptions.map(v => parseInt(v));
                            setValue("tag_ids", tagIds);
                          }}
                          disabled={isLoading}
                          size={8}
                          value={field.value.map(id => id.toString())}
                        >
                          {tagOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Hold Ctrl (or Cmd) to select multiple tags. Tags help categorize and filter techniques.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="related_technique_slugs" className="block font-medium">
                      Related Techniques
                    </label>
                    <Controller
                      name="related_technique_slugs"
                      control={control}
                      render={({ field }) => (
                        <select
                          id="related_technique_slugs"
                          multiple
                          className="w-full px-3 py-2 border rounded-md"
                          onChange={(e) => {
                            const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
                            setValue("related_technique_slugs", selectedOptions);
                          }}
                          disabled={isLoading}
                          size={6}
                          value={field.value}
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
                      Select techniques that are related or complementary to this one.
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

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`resource-authors-${index}`}>Authors (Optional)</Label>
                          <Input
                            id={`resource-authors-${index}`}
                            value={resource.authors || ""}
                            onChange={(e) => updateResource(index, "authors", e.target.value)}
                            placeholder="Enter authors"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`resource-publication-date-${index}`}>Publication Date (Optional)</Label>
                          <Input
                            id={`resource-publication-date-${index}`}
                            value={resource.publication_date || ""}
                            onChange={(e) => updateResource(index, "publication_date", e.target.value)}
                            placeholder="e.g., 2023-01-15"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`resource-source-type-${index}`}>Source Type (Optional)</Label>
                        <Input
                          id={`resource-source-type-${index}`}
                          value={resource.source_type || ""}
                          onChange={(e) => updateResource(index, "source_type", e.target.value)}
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