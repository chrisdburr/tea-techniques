import type { Metadata } from 'next';
import { Code, Network, Users } from '@/components/icons';
import {
  type IndexPageChildItem,
  IndexPageLayout,
} from '@/components/layout/index-page-layout';

export const metadata: Metadata = {
  title: 'Documentation - TEA Techniques',
  description:
    'Guides and technical documentation for the TEA Techniques platform, including community contributions, developer instructions, and knowledge graph resources.',
};

export default function DocsPage() {
  const docSections: IndexPageChildItem[] = [
    {
      title: 'Community Contributions',
      description:
        'Learn how to contribute new techniques, improvements, and feedback to the TEA Techniques repository.',
      icon: Users,
      href: '/docs/community-contributions',
    },
    {
      title: 'Developer Instructions',
      description:
        'Technical documentation for developers working with the TEA Techniques platform.',
      icon: Code,
      href: '/docs/developer-instructions',
    },
    {
      title: 'Knowledge Graph',
      description:
        'Explore the TEA Techniques knowledge graph, JSON-LD vocabulary, and MCP server for AI-powered technique discovery.',
      icon: Network,
      href: '/docs/knowledge-graph',
    },
  ];

  return (
    <IndexPageLayout
      description="Comprehensive guides and technical documentation for the TEA Techniques platform."
      gridCols={2}
      items={docSections}
      title="Documentation"
    />
  );
}
