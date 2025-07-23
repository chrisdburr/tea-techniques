// src/app/techniques/page.tsx
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
        <TechniquesListWrapper
          initialData={initialData}
          initialAssuranceGoals={assuranceGoals}
          initialTags={tags}
        />
      );
    } catch (error) {
      console.error("Error fetching techniques for SSG:", error);
      // Fallback to client-side loading
      return <TechniquesListWrapper />;
    }
  }

  // In API mode, use client-side data fetching
  return <TechniquesListWrapper />;
}

export default TechniquesPageServer;
