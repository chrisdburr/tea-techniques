// src/app/techniques/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { useTechniqueDetail, useDeleteTechnique } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Edit, 
  ExternalLink, 
  Loader2, 
} from "lucide-react";
import { useState } from "react";
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

// Component to display technique attributes
function TechniqueAttributes({ attributes }: { attributes: TechniqueAttribute[] }) {
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

export default function TechniqueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: technique, isLoading, error } = useTechniqueDetail(id);
  const deleteMutation = useDeleteTechnique();

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

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteDialogOpen(false);
      router.push("/techniques");
    } catch (error) {
      console.error("Error deleting technique:", error);
    }
  };

  return (
    <MainLayout>
      {/* Header section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button asChild variant="outline" size="sm" className="mb-4">
            <Link href="/techniques">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Techniques
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{technique.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/techniques/${id}/edit`}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Link>
          </Button>
          <Dialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="destructive">Delete</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Technique</DialogTitle>
                <DialogDescription>
                  {`Are you sure you want to delete "${technique.name}"? This action cannot be undone.`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs for organization */}
      <Tabs defaultValue="overview" className="mt-8">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="examples">Examples & Limitations</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="classification">Classification</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8">
          <Section title="Description">
            <p className="whitespace-pre-line">{technique.description}</p>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Assurance Goals</CardTitle>
                <CardDescription>
                  This technique supports the following assurance goals:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {technique.assurance_goals.map((goal) => (
                    <Badge key={goal.id} className="px-3 py-1 text-sm">
                      {goal.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Dependency</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-base">
                  {technique.model_dependency}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Examples & Limitations Tab */}
        <TabsContent value="examples" className="space-y-8">
          <Section title="Example Use Cases">
            <TechniqueExampleUseCases useCases={technique.example_use_cases} />
          </Section>

          <Section title="Limitations">
            <TechniqueLimitations limitations={technique.limitations} />
          </Section>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-8">
          <Section title="Resources">
            <TechniqueResources resources={technique.resources} />
          </Section>
        </TabsContent>

        {/* Classification Tab */}
        <TabsContent value="classification" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Categories that this technique belongs to</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {technique.categories.length > 0 ? (
                  technique.categories.map((category) => (
                    <div key={category.id} className="border-b pb-2 last:border-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{category.name}</h3>
                        <Badge variant="outline">{category.assurance_goal_name}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No categories specified.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subcategories</CardTitle>
                <CardDescription>Subcategories that this technique belongs to</CardDescription>
              </CardHeader>
              <CardContent>
                {technique.subcategories.length > 0 ? (
                  <div className="space-y-4">
                    {technique.subcategories.map((subcategory) => (
                      <div key={subcategory.id} className="border-b pb-2 last:border-0">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{subcategory.name}</h3>
                          <Badge variant="outline">{subcategory.category_name}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{subcategory.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No subcategories specified.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Section title="Attributes">
            <TechniqueAttributes attributes={technique.attributes} />
          </Section>

          {technique.tags.length > 0 && (
            <Section title="Tags">
              <div className="flex flex-wrap gap-2">
                {technique.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </Section>
          )}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}