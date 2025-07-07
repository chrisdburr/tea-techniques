"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useTechniqueDetail } from "@/lib/api/hooks";
import MainLayout from "@/components/layout/MainLayout";
import TechniqueForm from "@/components/technique/TechniqueForm";
import AuthWrapper from "@/components/common/AuthWrapper";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function EditTechniquePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const { data: technique, isLoading, error } = useTechniqueDetail(slug);
  
  const goBack = () => {
    router.push(`/techniques/${slug}`);
  };
  
  return (
    <MainLayout>
      <AuthWrapper authRequired>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Edit Technique</h1>
              <p className="text-muted-foreground">
                Update this technique with new information
              </p>
            </div>
            <Button onClick={goBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Details
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
            <TechniqueForm slug={slug} isEditMode={true} />
          ) : (
            <div className="text-center py-8">No technique found</div>
          )}
        </div>
      </AuthWrapper>
    </MainLayout>
  );
}