// src/app/techniques/[slug]/page.tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { getDataService } from "@/lib/services/dataServiceFactory";
import { isStaticMode } from "@/lib/config/dataConfig";
import TechniqueDetailClient from "./TechniqueDetailClient";
import { Loader2 } from "lucide-react";

interface PageProps {
  params: { slug: string };
}

// Generate static params for all techniques when in static mode
export async function generateStaticParams() {
  if (!isStaticMode()) {
    return [];
  }

  try {
    const dataService = getDataService();
    const techniques = await dataService.getTechniques();

    return techniques.results.map((technique) => ({
      slug: technique.slug,
    }));
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
  const { slug } = params;

  // Only use server-side data fetching in static mode
  if (isStaticMode()) {
    try {
      const dataService = getDataService();
      const technique = await dataService.getTechnique(slug);

      return (
        <MainLayout>
          <TechniqueDetailClient initialTechnique={technique} slug={slug} />
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
      <Suspense fallback={<LoadingState />}>
        <TechniqueDetailClient slug={slug} />
      </Suspense>
    </MainLayout>
  );
}

export default TechniqueDetailServer;
