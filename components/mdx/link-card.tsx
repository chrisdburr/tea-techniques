import Link from 'next/link';
import type { LucideIcon } from '@/components/icons';
import { ExternalLink } from '@/components/icons';
import { cn } from '@/lib/utils';

interface LinkCardProps {
  href: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  external?: boolean;
  className?: string;
}

export function LinkCard({
  href,
  title,
  description,
  icon: Icon,
  external = false,
  className,
}: LinkCardProps) {
  const isExternal = external || href.startsWith('http');
  const Component = isExternal ? 'a' : Link;

  const linkProps = isExternal
    ? {
        href,
        target: '_blank',
        rel: 'noopener noreferrer',
      }
    : { href };

  return (
    <Component
      {...linkProps}
      className={cn(
        'flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-secondary/50',
        className
      )}
    >
      {Icon && <Icon className="h-5 w-5 flex-shrink-0 text-primary" />}
      <div className="min-w-0 flex-1">
        <div className="font-medium">{title}</div>
        {description && (
          <div className="text-muted-foreground text-sm">{description}</div>
        )}
      </div>
      {isExternal && (
        <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      )}
    </Component>
  );
}
