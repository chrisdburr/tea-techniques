// src/app/techniques/add/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";

export default function AddTechniquePage() {
  const router = useRouter();
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Add New Technique</h1>
            <p className="text-muted-foreground">
              Temporarily disabled due to technical issues
            </p>
          </div>
          <Button onClick={() => router.push('/techniques')} variant="outline">
            Go Back
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-md border">
          <p className="mb-4">
            The form for adding new techniques is currently being improved to fix some technical issues.
            Please check back later or contact the site administrator for assistance.
          </p>
          
          <p className="mb-6">
            In the meantime, you can browse existing techniques using the filters.
          </p>
          
          <Button asChild>
            <Link href="/techniques">
              Back to Techniques
            </Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}