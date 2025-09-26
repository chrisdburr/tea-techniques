/**
 * Dynamic page for intermediate category dimensions
 *
 * This page handles routes like:
 * - /categories/explainability/property/
 * - /categories/explainability/attribution-methods/
 * - /categories/fairness/bias-detection/ (future)
 *
 * It displays all subcategories within a dimension and allows
 * users to navigate the hierarchical tag structure.
 */

import { ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { tagDefinitions } from '@/lib/data/tag-definitions';
import { TAG_HIERARCHIES } from '@/lib/data/tag-hierarchies';

// Force static rendering for static export
export const dynamic = 'force-static';

interface DimensionPageProps {
  params: Promise<{ goal: string; dimension: string }>;
}

/**
 * Generate static params for all dimension routes
 * Based on the hierarchical tags in the data
 */
export function generateStaticParams() {
  const params: { goal: string; dimension: string }[] = [];

  // For now, only generate for goals with hierarchical tagging configured
  for (const [goal, config] of Object.entries(TAG_HIERARCHIES)) {
    for (const dimension of Object.keys(config.dimensions)) {
      params.push({ goal, dimension });
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: DimensionPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { goal, dimension } = resolvedParams;

  const hierarchy = TAG_HIERARCHIES[goal];
  if (!hierarchy?.dimensions[dimension]) {
    return {
      title: 'Dimension Not Found - TEA Techniques',
    };
  }

  const dimensionConfig = hierarchy.dimensions[dimension];
  const goalName = goal.charAt(0).toUpperCase() + goal.slice(1);

  return {
    title: `${dimensionConfig.name} - ${goalName} - TEA Techniques`,
    description:
      dimensionConfig.description ||
      `Explore ${dimensionConfig.name.toLowerCase()} subcategories in ${goalName}.`,
  };
}

/**
 * Helper to load dimension data from generated JSON
 */
async function getDimensionData(goal: string, dimension: string) {
  try {
    const { default: data } = await import(
      `@/public/data/categories/${goal}/${dimension}/index.json`
    );
    return data;
  } catch {
    return null;
  }
}

export default async function DimensionPage({ params }: DimensionPageProps) {
  const resolvedParams = await params;
  const { goal, dimension } = resolvedParams;

  // Check if this is a valid hierarchical dimension
  const hierarchy = TAG_HIERARCHIES[goal];
  if (!hierarchy?.dimensions[dimension]) {
    notFound();
  }

  const dimensionConfig = hierarchy.dimensions[dimension];
  const goalName = goal.charAt(0).toUpperCase() + goal.slice(1);

  // Load dimension data (subcategories and technique count)
  const dimensionData = await getDimensionData(goal, dimension);

  // Format subcategory names for display
  const formatSubcategory = (sub: string) => {
    return sub
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link className="text-muted-foreground hover:text-primary" href="/">
          Home
        </Link>
        <span className="mx-2 text-muted-foreground">/</span>
        <Link
          className="text-muted-foreground hover:text-primary"
          href="/categories"
        >
          Categories
        </Link>
        <span className="mx-2 text-muted-foreground">/</span>
        <Link
          className="text-muted-foreground hover:text-primary"
          href={`/categories/${goal}`}
        >
          {goalName}
        </Link>
        <span className="mx-2 text-muted-foreground">/</span>
        <span className="text-foreground">{dimensionConfig.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <Badge className="mb-3 px-3 py-1 text-sm" variant="secondary">
            {goalName}
          </Badge>
          <h1 className="font-bold text-3xl text-foreground">
            {dimensionConfig.name}
          </h1>
        </div>

        {/* Dimension Description */}
        {dimensionConfig.description && (
          <div className="mb-4 rounded-lg bg-muted/50 p-4">
            <p className="text-base">{dimensionConfig.description}</p>
          </div>
        )}

        {/* Statistics */}
        {dimensionData && (
          <p className="text-lg text-muted-foreground">
            {dimensionData.subcategories?.length || 0} subcategories •{' '}
            {dimensionData.count || 0} techniques
          </p>
        )}
      </div>

      {/* Subcategories Grid */}
      {dimensionData?.subcategories &&
      dimensionData.subcategories.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dimensionData.subcategories.map((subcategory: string) => {
            const fullTag = `assurance-goal-category/${goal}/${dimension}/${subcategory}`;
            const definition = tagDefinitions[fullTag];
            const subcategoryUrl = `/categories/${goal}/${dimension}/${subcategory}`;

            return (
              <Link href={subcategoryUrl} key={subcategory}>
                <Card className="h-full transition-colors hover:bg-accent">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span>{formatSubcategory(subcategory)}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  {definition && (
                    <CardContent>
                      <p className="text-muted-foreground text-sm">
                        {definition}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No subcategories found in this dimension.
          </p>
        </div>
      )}

      {/* Back Links */}
      <div className="mt-12 flex justify-center gap-4 text-sm">
        <Link
          className="font-medium text-primary hover:text-primary/80"
          href={`/categories/${goal}`}
        >
          ← Back to {goalName}
        </Link>
        <span className="text-muted-foreground">|</span>
        <Link
          className="font-medium text-primary hover:text-primary/80"
          href="/categories"
        >
          All categories
        </Link>
      </div>
    </div>
  );
}
