import type { Metadata } from 'next';
import { columns } from '@/components/techniques-columns';
import { TechniquesDataTable } from '@/components/techniques-data-table';
import { getAllTechniquesMetadata } from '@/lib/data';

// Force static rendering for static export
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'All Techniques - TEA Techniques',
  description:
    'Browse all available techniques for responsible AI design, development, and deployment. Find techniques for explainability, fairness, privacy, reliability, safety, security, and transparency.',
};

export default async function TechniquesPage() {
  const techniques = await getAllTechniquesMetadata();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 font-bold text-3xl text-foreground">
          All Techniques
        </h1>
        <p className="text-muted-foreground">
          Explore our comprehensive collection of {techniques.length} techniques
          for responsible AI development.
        </p>
      </div>

      <TechniquesDataTable columns={columns} data={techniques} />
    </div>
  );
}
