import type { Metadata } from 'next';
import { FileText, Info, Tag, Users } from '@/components/icons';
import {
  type IndexPageChildItem,
  IndexPageLayout,
} from '@/components/layout/index-page-layout';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'About TEA Techniques - Trustworthy and Ethical Assurance',
  description:
    'Learn about the TEA Techniques project, a comprehensive resource for AI assurance techniques and methodologies.',
};

export default function AboutPage() {
  const sections: IndexPageChildItem[] = [
    {
      title: 'Project Information',
      description: 'Learn about the TEA platform and its mission',
      icon: Info,
      href: '/about/project-info',
    },
    {
      title: 'Technique Evaluation',
      description: 'Understand how techniques are evaluated and categorized',
      icon: FileText,
      href: '/about/technique-evaluation',
    },
    {
      title: 'Tag Definitions',
      description: 'Explore the meaning of tags and categories used',
      icon: Tag,
      href: '/about/tag-definitions',
    },
    {
      title: 'Community Contributions',
      description: 'How to contribute new techniques and improvements',
      icon: Users,
      href: '/docs/community-contributions',
    },
  ];

  const additionalContent = (
    <div className="prose prose-neutral dark:prose-invert mb-12 max-w-none">
      <h2 className="mt-8 mb-4 font-semibold text-2xl">
        What are TEA Techniques?
      </h2>
      <p>
        TEA Techniques are structured methodologies that help organizations and
        practitioners demonstrate that their AI systems meet specific ethical
        and trustworthiness criteria. Each technique provides actionable
        guidance on implementation, evaluation metrics, and integration with
        existing workflows.
      </p>

      <h2 className="mt-8 mb-4 font-semibold text-2xl">Our Mission</h2>
      <p>
        We aim to bridge the gap between high-level AI ethics principles and
        practical implementation by providing concrete, actionable techniques
        that can be applied throughout the AI lifecycle. Our goal is to make
        responsible AI development accessible and achievable for all
        practitioners.
      </p>
    </div>
  );

  return (
    <IndexPageLayout
      additionalSections={additionalContent}
      contentFirst={true}
      description="The Trustworthy and Ethical Assurance (TEA) Techniques repository is a comprehensive collection of methods, tools, and approaches for evidencing claims about responsible AI design, development, and deployment."
      gridCols={2}
      items={sections}
      title="About TEA Techniques"
    />
  );
}
