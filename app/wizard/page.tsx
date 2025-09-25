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
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 text-muted-foreground text-sm"
      >
        <ol className="flex items-center space-x-2">
          <li>
            <a className="hover:text-foreground" href="/">
              Home
            </a>
          </li>
          <li>/</li>
          <li aria-current="page" className="text-foreground">
            Technique Finder
          </li>
        </ol>
      </nav>

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
