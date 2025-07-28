import type { Metadata } from 'next';
import {
  Brain,
  CheckCircle,
  Eye,
  HelpCircle,
  Lock,
  Scale,
  Shield,
  ShieldCheck,
} from '@/components/icons';
import {
  type IndexPageChildItem,
  IndexPageLayout,
} from '@/components/layout/index-page-layout';
import { getAllTechniquesMetadata, getAssuranceGoals } from '@/lib/data';

// Server-side icon mapping
const goalIconsMap = {
  Explainability: Brain,
  Fairness: Scale,
  Security: Shield,
  Safety: ShieldCheck,
  Reliability: CheckCircle,
  Transparency: Eye,
  Privacy: Lock,
} as const;

// Force static rendering for static export
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Categories - TEA Techniques',
  description:
    'Browse techniques by assurance goals including explainability, fairness, privacy, reliability, safety, security, and transparency.',
};

export default async function CategoriesPage() {
  const [goals, techniques] = await Promise.all([
    getAssuranceGoals(),
    getAllTechniquesMetadata(),
  ]);

  // Count techniques per goal and convert to IndexPageChildItem format
  const goalItems: IndexPageChildItem[] = goals.map((goal) => {
    const techniqueCount = techniques.filter((t) =>
      t.assurance_goals?.includes(goal.name)
    ).length;

    // Get the appropriate icon from the goalIconsMap
    const IconComponent =
      goalIconsMap[goal.name as keyof typeof goalIconsMap] || HelpCircle;

    return {
      title: goal.name,
      description: goal.description,
      href: `/categories/${goal.slug}`,
      icon: IconComponent,
      count: techniqueCount,
    };
  });

  return (
    <IndexPageLayout
      description="Explore techniques organized by their primary assurance goals. Each category represents a key aspect of responsible AI development."
      gridCols={3}
      items={goalItems}
      title="Categories"
    />
  );
}
