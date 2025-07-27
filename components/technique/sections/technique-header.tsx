import Link from 'next/link';
import GoalIcon from '@/components/ui/goal-icon';
import type { Technique } from '@/lib/types';

interface TechniqueHeaderProps {
  technique: Technique;
}

export function TechniqueHeader({ technique }: TechniqueHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="mb-4 font-bold text-4xl text-foreground">
        {technique.name}
      </h1>

      {/* Assurance Goals */}
      <div className="flex flex-wrap items-center gap-2">
        {technique.assurance_goals?.map((goal) => (
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 transition-colors hover:bg-secondary/80"
            href={`/categories/${goal.toLowerCase().replace(/\s+/g, '-')}`}
            key={goal}
            title={`View all ${goal} techniques`}
          >
            <GoalIcon goalName={goal} size={16} />
            <span className="font-medium text-sm">{goal}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
