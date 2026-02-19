'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ComparisonTable } from '@/components/compare/comparison-table';
import { TechniqueSelector } from '@/components/compare/technique-selector';
import { getAssetPath } from '@/lib/config';
import type { Technique } from '@/lib/types';

type ComparisonData =
  | { status: 'idle'; techniques: Technique[] }
  | { status: 'loading'; techniques: Technique[] }
  | { status: 'loaded'; techniques: Technique[] }
  | { status: 'error'; techniques: Technique[]; error: string };

interface ComparisonContainerProps {
  techniques: Technique[]; // Metadata only
}

export function ComparisonContainer({ techniques }: ComparisonContainerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ComparisonData>({
    status: 'idle',
    techniques: [],
  });

  // Parse URL query params on mount and when they change
  useEffect(() => {
    const techniquesParam = searchParams.get('techniques');
    if (techniquesParam) {
      const slugs = techniquesParam.split(',').filter(Boolean).slice(0, 3);
      setSelectedSlugs(slugs);
    }
  }, [searchParams]);

  // Fetch full technique data when slugs change
  useEffect(() => {
    if (selectedSlugs.length === 0) {
      setComparison({ status: 'idle', techniques: [] });
      return;
    }

    let cancelled = false;
    setComparison((prev) => ({
      status: 'loading',
      techniques: prev.techniques,
    }));

    Promise.all(
      selectedSlugs.map((slug) =>
        fetch(getAssetPath(`/data/techniques/${slug}.json`)).then((r) =>
          r.json()
        )
      )
    )
      .then((responses) => {
        if (!cancelled) {
          setComparison({
            status: 'loaded',
            techniques: responses.filter(Boolean),
          });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setComparison({
            status: 'error',
            techniques: [],
            error: String(error),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSlugs]);

  // Update URL when selection changes
  const handleSelectionChange = (slugs: string[]) => {
    setSelectedSlugs(slugs);
    if (slugs.length > 0) {
      router.push(`/compare?techniques=${slugs.join(',')}`, { scroll: false });
    } else {
      router.push('/compare', { scroll: false });
    }
  };

  const handleRemoveTechnique = (slug: string) => {
    const newSlugs = selectedSlugs.filter((s) => s !== slug);
    handleSelectionChange(newSlugs);
  };

  const handleClearAll = () => {
    handleSelectionChange([]);
  };

  return (
    <div className="space-y-8">
      <TechniqueSelector
        availableTechniques={techniques}
        maxSelections={3}
        onSelectionChange={handleSelectionChange}
        selectedSlugs={selectedSlugs}
      />

      {comparison.status === 'loading' && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Loading comparison...</p>
        </div>
      )}

      {(comparison.status === 'loaded' || comparison.status === 'error') &&
        comparison.techniques.length > 0 && (
          <ComparisonTable
            onClearAll={handleClearAll}
            onRemoveTechnique={handleRemoveTechnique}
            techniques={comparison.techniques}
          />
        )}

      {(comparison.status === 'idle' ||
        ((comparison.status === 'loaded' || comparison.status === 'error') &&
          comparison.techniques.length === 0)) && (
        <div className="rounded-lg border-2 border-dashed py-12 text-center">
          <p className="mb-2 text-lg text-muted-foreground">
            No techniques selected
          </p>
          <p className="text-muted-foreground text-sm">
            Select 2-3 techniques above to begin comparing
          </p>
        </div>
      )}
    </div>
  );
}
