// src/app/techniques/page.tsx
import { Suspense } from "react";
import MainLayout from "@/components/layout/MainLayout";
import TechniquesList from "@/components/technique/TechniquesList";
import { getDataService } from "@/lib/services/dataServiceFactory";
import { isStaticMode } from "@/lib/config/dataConfig";

// Loading component
function LoadingState() {
  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <p className="text-lg text-muted-foreground">Loading techniques...</p>
    </div>
  );
}

// Server component for static generation
async function TechniquesPageServer() {
  // Only use server-side data fetching in static mode
  if (isStaticMode()) {
    try {
      const dataService = getDataService();
      const initialData = await dataService.getTechniques();
      const assuranceGoals = await dataService.getAssuranceGoals();
      const tags = await dataService.getTags();

      return (
        <MainLayout>
          <TechniquesList
            initialData={initialData}
            initialAssuranceGoals={assuranceGoals}
            initialTags={tags}
          />
        </MainLayout>
      );
    } catch (error) {
      console.error("Error fetching techniques for SSG:", error);
      // Fallback to client-side loading
      return (
        <MainLayout>
          <Suspense fallback={<LoadingState />}>
            <TechniquesList />
          </Suspense>
        </MainLayout>
      );
    }
  }

  // In API mode, use client-side data fetching
  return (
    <MainLayout>
      <Suspense fallback={<LoadingState />}>
        <TechniquesList />
      </Suspense>
    </MainLayout>
  );
}

export default TechniquesPageServer;
