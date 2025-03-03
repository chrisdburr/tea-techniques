// src/app/techniques/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { useTechniqueDetail } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import Link from "next/link";
import { 
  ArrowLeft, 
  Edit, 
  ExternalLink, 
  Loader2,
  Info,
  Lock,
} from "lucide-react";
import { 
  TechniqueAttribute, 
  TechniqueResource, 
  TechniqueExampleUseCase, 
  TechniqueLimitation 
} from "@/lib/types";

// Helper component for section headers
function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-xl font-semibold mb-4">{title}</h2>;
}

// Helper component for section containers
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <SectionTitle title={title} />
      <div className="bg-card rounded-lg border p-4">{children}</div>
    </div>
  );
}

// Component to display technique attributes in the sidebar
function TechniqueAttributesSidebar({ attributes }: { attributes: TechniqueAttribute[] }) {
  if (!attributes || attributes.length === 0) {
    return <p className="text-muted-foreground">No attributes specified.</p>;
  }

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
        <div key={type} className="space-y-2">
          <h3 className="text-sm font-medium">{type}</h3>
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
  if (!resources || resources.length === 0) {
    return <p className="text-muted-foreground">No resources available.</p>;
  }

  // Group resources by type
  const resourcesByType = resources.reduce((acc, resource) => {
    const typeName = resource.resource_type_name;
    if (!acc[typeName]) {
      acc[typeName] = [];
    }
    acc[typeName].push(resource);
    return acc;
  }, {} as Record<string, TechniqueResource[]>);

  return (
    <div className="space-y-4">
      {Object.entries(resourcesByType).map(([typeName, resources]) => (
        <div key={typeName} className="space-y-2">
          <h3 className="text-sm font-medium">{typeName}</h3>
          {resources.map((resource) => (
            <div key={resource.id} className="border rounded-md p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{resource.title}</h4>
                <Button asChild variant="outline" size="sm">
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" /> View
                  </a>
                </Button>
              </div>
              {resource.description && (
                <p className="text-sm mt-2 text-muted-foreground">{resource.description}</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Component to display technique example use cases
function TechniqueExampleUseCases({ useCases }: { useCases: TechniqueExampleUseCase[] }) {
  if (!useCases || useCases.length === 0) {
    return <p className="text-muted-foreground">No example use cases specified.</p>;
  }

  return (
    <div className="space-y-4">
      {useCases.map((useCase) => (
        <div key={useCase.id} className="border rounded-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium">Example Use Case</h3>
            {useCase.assurance_goal_name && (
              <Badge variant="outline">
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
  if (!limitations || limitations.length === 0) {
    return <p className="text-muted-foreground">No limitations specified.</p>;
  }

  return (
    <div className="space-y-4">
      {limitations.map((limitation) => (
        <div key={limitation.id} className="border rounded-md p-4">
          <p className="text-sm">{limitation.description}</p>
        </div>
      ))}
    </div>
  );
}

// Reusable tooltip component with info icon
function InfoLabel({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <Tooltip content={tooltip}>
      <div className="inline-flex items-center cursor-help">
        {label}
        <Info className="ml-1 h-4 w-4 text-muted-foreground" />
      </div>
    </Tooltip>
  );
}

export default function TechniqueDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  // This would be replaced with actual auth state - for now always false
  const isAuthenticated = false;

  const { data: technique, isLoading, error } = useTechniqueDetail(id);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading technique details...</span>
        </div>
      </MainLayout>
    );
  }

  if (error || !technique) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <h1 className="text-2xl font-bold mb-4">
            Error Loading Technique
          </h1>
          <p className="text-muted-foreground mb-8">
            There was an error loading this technique. It may not
            exist or you may not have permission to view it.
          </p>
          <Button asChild>
            <Link href="/techniques">Back to Techniques</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <TooltipProvider>
      <MainLayout>
        {/* Header section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{technique.name}</h1>
        </div>

        {/* Responsive layout with main content and sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            <Section title="Description">
              <p className="whitespace-pre-line">
                {technique.description}
              </p>
            </Section>

            <Section title="Example Use Cases">
              <TechniqueExampleUseCases
                useCases={technique.example_use_cases}
              />
            </Section>

            <Section title="Limitations">
              <TechniqueLimitations
                limitations={technique.limitations}
              />
            </Section>

            <Section title="Resources">
              <TechniqueResources
                resources={technique.resources}
              />
            </Section>
          </div>

          {/* Sidebar with technique attributes */}
          <div>
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  <InfoLabel
                    label="Technique Attributes"
                    tooltip="Classification metadata for this technique"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">
                    <InfoLabel
                      label="Model Dependency"
                      tooltip="Indicates whether this technique requires access to model internals"
                    />
                  </h3>
                  <div>
                    <Badge
                      variant="outline"
                      className="text-sm"
                    >
                      {technique.model_dependency}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">
                    <InfoLabel
                      label="Assurance Goals"
                      tooltip="The primary goals that this technique helps achieve"
                    />
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {technique.assurance_goals.map(
                      (goal) => (
                        <Badge
                          key={goal.id}
                          className="text-sm"
                        >
                          {goal.name}
                        </Badge>
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">
                    <InfoLabel
                      label="Categories"
                      tooltip="Main classification groups for this technique"
                    />
                  </h3>
                  <div className="space-y-2">
                    {technique.categories.length > 0 ? (
                      technique.categories.map(
                        (category) => (
                          <div
                            key={category.id}
                            className="flex justify-between items-center text-sm py-1 border-b last:border-0 border-muted"
                          >
                            <span>
                              {category.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              {
                                category.assurance_goal_name
                              }
                            </Badge>
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        None specified
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">
                    <InfoLabel
                      label="Subcategories"
                      tooltip="More specific classification within categories"
                    />
                  </h3>
                  <div className="space-y-2">
                    {technique.subcategories.length > 0 ? (
                      technique.subcategories.map(
                        (subcategory) => (
                          <div
                            key={subcategory.id}
                            className="flex justify-between items-center text-sm py-1 border-b last:border-0 border-muted"
                          >
                            <span>
                              {subcategory.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              {
                                subcategory.category_name
                              }
                            </Badge>
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        None specified
                      </p>
                    )}
                  </div>
                </div>

                {technique.attributes.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">
                      <InfoLabel
                        label="Technical Attributes"
                        tooltip="Detailed classification attributes for this technique"
                      />
                    </h3>
                    <TechniqueAttributesSidebar
                      attributes={technique.attributes}
                    />
                  </div>
                )}

                {technique.tags.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">
                      <InfoLabel
                        label="Tags"
                        tooltip="Keywords associated with this technique"
                      />
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {technique.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              
              {/* Edit section - delete will be accessible from edit form later */}
              <CardFooter className="flex flex-col items-stretch pt-4 pb-4 border-t">
                <div
                  className={`bg-muted/50 rounded p-3 mb-4 flex items-center ${
                    isAuthenticated ? "hidden" : ""
                  }`}
                >
                  <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Authentication is required to edit a
                    technique. Not implemented yet.
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                  disabled={!isAuthenticated}
                >
                  {/* <Link href={`/techniques/${id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                    Technique
                  </Link> */}
                  <Link href="#">
                    <Edit className="h-4 w-4 mr-2" /> Edit
                    Technique
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Back button at the bottom */}
        <div className="mt-8">
          <Button asChild variant="outline" size="sm">
            <Link href="/techniques">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to
              Techniques
            </Link>
          </Button>
        </div>
      </MainLayout>
    </TooltipProvider>
  );
}