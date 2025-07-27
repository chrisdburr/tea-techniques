import type React from 'react';
import type { LucideIcon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type HeadingLevel = 'h2' | 'h3' | 'h4';

interface IconHeadingProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  badge?: string;
  level?: HeadingLevel;
  className?: string;
}

const headingStyles = {
  h2: 'text-2xl font-semibold',
  h3: 'text-xl font-semibold',
  h4: 'text-lg font-medium',
};

export function IconHeading({
  children,
  icon: Icon,
  badge,
  level = 'h3',
  className,
}: IconHeadingProps) {
  const Component = level;

  return (
    <Component
      className={cn('flex items-center gap-2', headingStyles[level], className)}
    >
      {Icon && <Icon className="h-5 w-5 text-primary" />}
      <span>{children}</span>
      {badge && (
        <Badge className="ml-2 font-normal" variant="secondary">
          {badge}
        </Badge>
      )}
    </Component>
  );
}
