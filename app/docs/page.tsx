import { Code, Users } from '@/components/icons';
import {
  type IndexPageChildItem,
  IndexPageLayout,
} from '@/components/layout/index-page-layout';

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
