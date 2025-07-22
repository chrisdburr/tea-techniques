// src/app/techniques/[slug]/page.tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { getDataService } from "@/lib/services/dataServiceFactory";
import { isStaticMode } from "@/lib/config/dataConfig";
import TechniqueDetailClient from "./TechniqueDetailClient";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { Loader2 } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all techniques when in static mode
export async function generateStaticParams() {
  if (!isStaticMode()) {
    return [];
  }

  try {
    const dataService = getDataService();
    // For static generation, we need ALL techniques, not just the first page
    // Fetch with a very high page size to get all techniques at once
    const allTechniques = await dataService.getTechniques({}, 1);

    // If we have more than 20 techniques, we need to fetch all pages
    const allSlugs = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await dataService.getTechniques({}, currentPage);
      allSlugs.push(
        ...response.results.map((technique) => ({ slug: technique.slug })),
      );

      hasMore = response.next !== null;
      currentPage++;
    }

    console.log(`Generating static params for ${allSlugs.length} techniques`);
    return allSlugs;
  } catch (error) {
    console.error("Error generating static params for techniques:", error);
    return [];
  }
}

// Loading component
function LoadingState() {
  return (
    <div className="flex justify-center items-center py-12">
      <Loader2
        className="h-8 w-8 animate-spin text-primary"
        aria-hidden="true"
      />
      <span className="ml-2">Loading technique details...</span>
    </div>
  );
}

// Server component for static generation
async function TechniqueDetailServer({ params }: PageProps) {
  const { slug } = await params;

  // Only use server-side data fetching in static mode
  if (isStaticMode()) {
    try {
      const dataService = getDataService();
      const technique = await dataService.getTechnique(slug);

      return (
        <MainLayout>
          <ErrorBoundary>
            <TechniqueDetailClient initialTechnique={technique} slug={slug} />
          </ErrorBoundary>
        </MainLayout>
      );
    } catch (error) {
      console.error(`Error fetching technique ${slug} for SSG:`, error);
      notFound();
    }
  }

  // In API mode, use client-side data fetching
  return (
    <MainLayout>
      <ErrorBoundary>
        <Suspense fallback={<LoadingState />}>
          <TechniqueDetailClient slug={slug} />
        </Suspense>
      </ErrorBoundary>
    </MainLayout>
  );
}

export default TechniqueDetailServer;
