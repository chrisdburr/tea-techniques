"use client";

import React from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import TechniqueForm from "@/components/technique/TechniqueForm";
import AuthWrapper from "@/components/common/AuthWrapper";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AddTechniquePage() {
  const router = useRouter();
  
  return (
    <MainLayout>
      <AuthWrapper authRequired>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Add New Technique</h1>
              <p className="text-muted-foreground">
                Create a new technique for the collection
              </p>
            </div>
            <Button onClick={() => router.push('/techniques')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Techniques
            </Button>
          </div>
          
          <TechniqueForm />
        </div>
      </AuthWrapper>
    </MainLayout>
  );
}