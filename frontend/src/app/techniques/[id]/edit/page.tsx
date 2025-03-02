// src/app/techniques/[id]/edit/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTechniqueDetail } from "@/lib/api/hooks";
import MainLayout from "@/components/layout/MainLayout";
// Import Button but don't use TechniqueForm which is causing issues
import { Button } from "@/components/ui/button";

// Temporary replacement for the problematic TechniqueForm
export default function EditTechniquePage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  
  // Just fetch the technique data
  const { data: technique, isLoading, error } = useTechniqueDetail(id);
  
  const goBack = () => {
    router.push(`/techniques/${id}`);
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Edit Technique</h1>
            <p className="text-muted-foreground">
              Temporarily disabled due to technical issues
            </p>
          </div>
          <Button onClick={goBack} variant="outline">
            Go Back
          </Button>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">Loading technique details...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            <p>There was an error loading this technique.</p>
            <p className="text-sm mt-2">{(error as Error)?.message || "Unknown error"}</p>
          </div>
        ) : technique ? (
          <div className="bg-white p-6 rounded-md border">
            <div className="grid gap-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Name</h2>
                <p>{technique.name}</p>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-1">Description</h2>
                <p className="whitespace-pre-line">{technique.description}</p>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-1">Model Dependency</h2>
                <p>{technique.model_dependency}</p>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-1">Assurance Goals</h2>
                <ul className="list-disc ml-5">
                  {technique.assurance_goals.map(goal => (
                    <li key={goal.id}>{goal.name}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-1">Categories</h2>
                <ul className="list-disc ml-5">
                  {technique.categories.map(cat => (
                    <li key={cat.id}>{cat.name}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-8 flex gap-3">
              <Button asChild variant="outline">
                <Link href={`/techniques/${id}`}>
                  View Details
                </Link>
              </Button>
              <Button asChild>
                <Link href="/techniques">
                  Back to All Techniques
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">No technique found</div>
        )}
      </div>
    </MainLayout>
  );
}