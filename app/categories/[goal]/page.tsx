import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { columns } from '@/components/techniques-columns';
import { TechniquesDataTable } from '@/components/techniques-data-table';
import GoalIcon from '@/components/ui/goal-icon';
import {
  generateCategoryParams,
  getAssuranceGoals,
  getTechniquesByGoal,
} from '@/lib/data';

// Force static rendering for static export
export const dynamic = 'force-static';

interface CategoryPageProps {
  params: Promise<{ goal: string }>;
}

export async function generateStaticParams() {
  const params = await generateCategoryParams();
  return params;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const goals = await getAssuranceGoals();
  const goal = goals.find((g) => g.slug === resolvedParams.goal);

  if (!goal) {
    return {
      title: 'Category Not Found - TEA Techniques',
    };
  }

  return {
    title: `${goal.name} Techniques - TEA Techniques`,
    description: `Explore techniques for ${goal.name.toLowerCase()}: ${goal.description}`,
    keywords: [
      goal.name,
      'AI',
      'responsible AI',
      'machine learning',
      ...goal.name.toLowerCase().split(' '),
    ],
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  const goals = await getAssuranceGoals();
  const goal = goals.find((g) => g.slug === resolvedParams.goal);

  if (!goal) {
    notFound();
  }

  const techniques = await getTechniquesByGoal(goal.name);

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
        <span className="text-foreground">{goal.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-4">
          <div className="rounded-full bg-secondary p-4">
            <GoalIcon goalName={goal.name} size={32} />
          </div>
          <div>
            <h1 className="font-bold text-3xl text-foreground">{goal.name}</h1>
            <p className="text-muted-foreground">
              {techniques.length} technique{techniques.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <p className="mb-6 text-lg text-muted-foreground">{goal.description}</p>
      </div>

      {/* Techniques Table */}
      <TechniquesDataTable columns={columns} data={techniques} />

      {/* Back to Categories */}
      <div className="mt-12 text-center">
        <Link
          className="font-medium text-primary hover:text-primary/80"
          href="/categories"
        >
          ← Back to all categories
        </Link>
      </div>
    </div>
  );
}
