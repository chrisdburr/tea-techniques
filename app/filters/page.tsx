import type { Metadata } from 'next';
import {
  BarChart,
  Brain,
  Clock,
  Database,
  FileType,
  Globe,
  Search,
} from '@/components/icons';
import {
  type IndexPageChildItem,
  IndexPageLayout,
} from '@/components/layout/index-page-layout';

// Force static rendering for static export
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Filters - TEA Techniques',
  description:
    'Filter techniques by expertise level, lifecycle stage, type, and other characteristics.',
};

export default function FiltersPage() {
  const filterCategories: IndexPageChildItem[] = [
    {
      title: 'Expertise Level',
      description:
        'Filter by the required expertise level to implement techniques',
      icon: BarChart,
      href: '/filters/expertise-needed',
    },
    {
      title: 'Lifecycle Stage',
      description:
        'Find techniques for specific development and deployment stages',
      icon: Clock,
      href: '/filters/lifecycle-stage',
    },
    {
      title: 'Applicable Models',
      description:
        'Filter by the types of models the technique can be applied to',
      icon: Brain,
      href: '/filters/applicable-models',
    },
    {
      title: 'Technique Type',
      description: 'Browse techniques by their type and category',
      icon: FileType,
      href: '/filters/technique-type',
    },
    {
      title: 'Data Type',
      description: 'Techniques specific to different data types and formats',
      icon: Globe,
      href: '/filters/data-type',
    },
    {
      title: 'Evidence Type',
      description: 'Filter by type of evidence and validation approach',
      icon: Search,
      href: '/filters/evidence-type',
    },
    {
      title: 'Data Requirements',
      description: 'Browse by data requirements and prerequisites',
      icon: Database,
      href: '/filters/data-requirements',
    },
  ];

  return (
    <IndexPageLayout
      description="Refine your search by filtering techniques based on various characteristics. Select a filter category to explore specific techniques."
      gridCols={3}
      items={filterCategories}
      title="Filters"
    />
  );
}
