import { BookOpen, Clock, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getColabUrl,
  getGitHubUrl,
  getTutorialConfig,
  type TutorialConfig,
} from '@/lib/tutorials-config';

interface TutorialBadgeProps {
  techniqueSlug: string;
  /** Display mode: 'badge' for compact, 'full' for detailed with buttons */
  mode?: 'badge' | 'full';
}

export function TutorialBadge({
  techniqueSlug,
  mode = 'badge',
}: TutorialBadgeProps) {
  const config = getTutorialConfig(techniqueSlug);

  if (!config) {
    return null;
  }

  if (mode === 'badge') {
    return <TutorialBadgeCompact config={config} />;
  }

  return <TutorialBadgeFull config={config} />;
}

function TutorialBadgeCompact({ config }: { config: TutorialConfig }) {
  if (config.status === 'available') {
    return (
      <Link
        href={getColabUrl(config)}
        rel="noopener noreferrer"
        target="_blank"
      >
        <Badge className="gap-1.5 bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50">
          <BookOpen className="h-3 w-3" />
          Interactive Tutorial
        </Badge>
      </Link>
    );
  }

  if (config.status === 'coming-soon') {
    return (
      <Badge
        className="gap-1.5 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
        variant="outline"
      >
        <Clock className="h-3 w-3" />
        Tutorial Coming Soon
      </Badge>
    );
  }

  // Planned - show subtle indicator
  return (
    <Badge
      className="gap-1.5 text-muted-foreground opacity-60"
      variant="outline"
    >
      <BookOpen className="h-3 w-3" />
      Tutorial Planned
    </Badge>
  );
}

function TutorialBadgeFull({ config }: { config: TutorialConfig }) {
  const difficultyColors = {
    beginner: 'text-green-600 dark:text-green-400',
    intermediate: 'text-amber-600 dark:text-amber-400',
    advanced: 'text-red-600 dark:text-red-400',
  };

  if (config.status === 'available') {
    return (
      <div className="rounded-lg border bg-green-50/50 p-4 dark:bg-green-950/20">
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h3 className="font-semibold text-green-800 dark:text-green-300">
            Interactive Tutorial Available
          </h3>
        </div>

        <div className="mb-4 flex flex-wrap gap-4 text-muted-foreground text-sm">
          {config.estimatedMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />~{config.estimatedMinutes} min
            </span>
          )}
          {config.difficulty && (
            <span
              className={`capitalize ${difficultyColors[config.difficulty]}`}
            >
              {config.difficulty}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link
              href={getColabUrl(config)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Image
                alt="Open in Colab"
                className="h-5"
                height={20}
                src="https://colab.research.google.com/assets/colab-badge.svg"
                unoptimized
                width={117}
              />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link
              href={getGitHubUrl(config)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ExternalLink className="h-4 w-4" />
              View on GitHub
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (config.status === 'coming-soon') {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <h3 className="font-semibold text-amber-800 dark:text-amber-300">
            Interactive Tutorial Coming Soon
          </h3>
        </div>
        <p className="mt-2 text-muted-foreground text-sm">
          We&apos;re working on a hands-on tutorial for this technique. Check
          back soon!
        </p>
      </div>
    );
  }

  // Planned - minimal display
  return (
    <div className="rounded-lg border border-dashed p-4 opacity-60">
      <div className="flex items-center gap-2 text-muted-foreground">
        <BookOpen className="h-5 w-5" />
        <span className="text-sm">Interactive tutorial planned</span>
      </div>
    </div>
  );
}
