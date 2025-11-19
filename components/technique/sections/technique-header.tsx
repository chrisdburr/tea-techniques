import Link from 'next/link';
import GoalIcon from '@/components/ui/goal-icon';
import type { Technique } from '@/lib/types';

interface TechniqueHeaderProps {
  technique: Technique;
}

export function TechniqueHeader({ technique }: TechniqueHeaderProps) {
  return (
    <div className="mb-10 border-b pb-8">
      <h1 className="mb-6 font-bold text-4xl text-foreground tracking-tight lg:text-5xl">
        {technique.name}
      </h1>

      {/* Assurance Goals */}
      <div className="flex flex-wrap items-center gap-3">
        {technique.assurance_goals?.map((goal) => (
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-secondary/50 px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            href={`/categories/${goal.toLowerCase().replace(/\s+/g, '-')}`}
            key={goal}
            title={`View all ${goal} techniques`}
          >
            <GoalIcon goalName={goal} size={18} />
            <span>{goal}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
