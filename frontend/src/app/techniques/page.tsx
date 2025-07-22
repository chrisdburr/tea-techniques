// src/app/techniques/page.tsx
import MainLayout from "@/components/layout/MainLayout";
import TechniquesListWrapper from "@/components/technique/TechniquesListWrapper";
import { getDataService } from "@/lib/services/dataServiceFactory";
import { isStaticMode } from "@/lib/config/dataConfig";

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
          <TechniquesListWrapper
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
          <TechniquesListWrapper />
        </MainLayout>
      );
    }
  }

  // In API mode, use client-side data fetching
  return (
    <MainLayout>
      <TechniquesListWrapper />
    </MainLayout>
  );
}

export default TechniquesPageServer;
