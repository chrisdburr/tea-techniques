import type { Metadata } from 'next';
import { WizardPageWrapper } from '@/components/wizard/wizard-page-wrapper';
import { getAllTechniquesMetadata } from '@/lib/data';

// Force static rendering for static export
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Technique Finder Wizard - TEA Techniques',
  description:
    'Use our interactive wizard to find the most appropriate AI assurance techniques for your needs. Filter by assurance goals, model types, and more.',
  keywords: [
    'AI technique finder',
    'responsible AI wizard',
    'AI assurance methods',
    'technique selection tool',
    'explainability techniques',
    'fairness techniques',
    'AI safety methods',
  ],
  openGraph: {
    title: 'Technique Finder Wizard - TEA Techniques',
    description:
      'Interactive wizard to help you find the right AI assurance techniques',
    type: 'website',
  },
};

export default async function WizardPage() {
  const techniques = await getAllTechniquesMetadata();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-4 font-bold text-3xl">Find the Right Technique</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Answer a few questions to discover the most appropriate techniques for
          your AI assurance needs.
        </p>
      </div>

      {/* Wizard Component */}
      <WizardPageWrapper techniques={techniques} />
    </div>
  );
}
