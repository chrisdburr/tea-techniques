// src/components/technique/TechniqueFormRefactored.tsx
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  useCreateTechnique,
  useUpdateTechnique,
  useAssuranceGoals,
  useTags,
  useResourceTypes,
  useTechniqueDetail,
  useTechniques,
} from "@/lib/api/hooks";
import { TechniqueFormData, Technique } from "@/lib/types";
import { useApiError } from "@/lib/hooks/useApiError";
import { useDynamicArrays } from "@/hooks/useDynamicArrays";

// Form components
import { BasicInfoTab } from "./form/BasicInfoTab";
import { ClassificationTab } from "./form/ClassificationTab";
import { ExamplesLimitationsTab } from "./form/ExamplesLimitationsTab";
import { ResourcesTab } from "./form/ResourcesTab";

// Form schema and initial data
import { techniqueSchema, initialFormData } from "./form/schema";

// UI components
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save } from "lucide-react";

interface TechniqueFormProps {
  id?: number;
  isEditMode?: boolean;
}

export default function TechniqueFormRefactored({ id, isEditMode = false }: TechniqueFormProps) {
  const router = useRouter();
  const { handleError } = useApiError();

  // Form state management
  const {
    control,
    handleSubmit: hookFormSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<TechniqueFormData>({
    resolver: zodResolver(techniqueSchema),
    defaultValues: initialFormData,
    mode: "onBlur"
  });

  // Dynamic arrays management
  const {
    useCases,
    limitations,
    resources,
    setUseCases,
    setLimitations,
    setResources,
    addUseCase,
    updateUseCase,
    removeUseCase,
    addLimitation,
    updateLimitation,
    removeLimitation,
    addResource,
    updateResource,
    removeResource,
  } = useDynamicArrays();

  // API hooks
  const { data: techniqueData, isLoading: isLoadingTechnique } = useTechniqueDetail(id || 0);
  const { data: assuranceGoalsData, isLoading: isLoadingGoals } = useAssuranceGoals();
  const { data: tagsData, isLoading: isLoadingTags } = useTags();
  const { data: resourceTypesData, isLoading: isLoadingResourceTypes } = useResourceTypes();
  const { data: techniquesData, isLoading: isLoadingTechniques } = useTechniques();

  // Mutations
  const createMutation = useCreateTechnique();
  const updateMutation = useUpdateTechnique(id || 0);

  // Loading state
  const isLoading =
    isLoadingGoals ||
    isLoadingTags ||
    isLoadingResourceTypes ||
    isLoadingTechniques ||
    (isEditMode && isLoadingTechnique) ||
    isSubmitting ||
    createMutation.isPending ||
    updateMutation.isPending;

  // Initialize form for edit mode
  useEffect(() => {
    if (isEditMode && techniqueData) {
      // Extract IDs from relationships
      const assurance_goal_ids = techniqueData.assurance_goals.map(goal => goal.id);
      const tag_ids = techniqueData.tags.map(tag => tag.id);
      const related_technique_ids = techniqueData.related_techniques || [];

      // Set dynamic arrays
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

      // Update form values
      reset({
        name: techniqueData.name,
        description: techniqueData.description,
        complexity_rating: techniqueData.complexity_rating,
        computational_cost_rating: techniqueData.computational_cost_rating,
        assurance_goal_ids,
        tag_ids,
        related_technique_ids,
        resources: [],
        example_use_cases: [],
        limitations: [],
      });
    }
  }, [isEditMode, techniqueData, reset, setUseCases, setLimitations, setResources]);

  // Form submission
  const onSubmit: SubmitHandler<TechniqueFormData> = async (data) => {
    // Filter out empty entries
    const filteredUseCases = useCases.filter(uc => uc.description.trim() !== "");
    const filteredLimitations = limitations.filter(lim => lim.trim() !== "");
    const filteredResources = resources.filter(res => res.title.trim() !== "" && res.url.trim() !== "");

    const finalFormData: TechniqueFormData = {
      ...data,
      example_use_cases: filteredUseCases,
      limitations: filteredLimitations,
      resources: filteredResources,
    };

    try {
      if (isEditMode && id) {
        await updateMutation.mutateAsync(finalFormData);
        router.push(`/techniques/${id}`);
      } else {
        const result = await createMutation.mutateAsync(finalFormData);
        if (result && result.id) {
          router.push(`/techniques/${result.id}`);
        } else {
          router.push(`/techniques`);
          console.warn("Received null or invalid result from API");
        }
      }
    } catch (error) {
      console.error("Error submitting technique:", error);
      handleError(error);
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

  const relatedTechniqueOptions = (techniquesData as any)?.results
    ?.filter((t: Technique) => t.id !== id)
    ?.map((technique: Technique) => ({
      value: technique.id.toString(),
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

          <TabsContent value="basic">
            <BasicInfoTab
              control={control}
              errors={errors}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="classification">
            <ClassificationTab
              control={control}
              errors={errors}
              setValue={setValue}
              isLoading={isLoading}
              assuranceGoalOptions={assuranceGoalOptions}
              tagOptions={tagOptions}
              relatedTechniqueOptions={relatedTechniqueOptions}
            />
          </TabsContent>

          <TabsContent value="examples">
            <ExamplesLimitationsTab
              useCases={useCases}
              limitations={limitations}
              isLoading={isLoading}
              assuranceGoalOptions={assuranceGoalOptions}
              addUseCase={addUseCase}
              updateUseCase={updateUseCase}
              removeUseCase={removeUseCase}
              addLimitation={addLimitation}
              updateLimitation={updateLimitation}
              removeLimitation={removeLimitation}
            />
          </TabsContent>

          <TabsContent value="resources">
            <ResourcesTab
              resources={resources}
              isLoading={isLoading}
              resourceTypeOptions={resourceTypeOptions}
              addResource={addResource}
              updateResource={updateResource}
              removeResource={removeResource}
            />
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