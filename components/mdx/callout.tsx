import type React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Lightbulb,
} from '@/components/icons';
import { cn } from '@/lib/utils';

type CalloutVariant = 'info' | 'warning' | 'tip' | 'danger';

interface CalloutProps {
  children: React.ReactNode;
  variant?: CalloutVariant;
  title?: string;
  className?: string;
}

const variantConfig = {
  info: {
    icon: Info,
    className:
      'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30',
    iconClassName: 'text-blue-600 dark:text-blue-400',
  },
  warning: {
    icon: AlertTriangle,
    className:
      'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30',
    iconClassName: 'text-yellow-600 dark:text-yellow-400',
  },
  tip: {
    icon: Lightbulb,
    className:
      'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30',
    iconClassName: 'text-green-600 dark:text-green-400',
  },
  danger: {
    icon: AlertCircle,
    className:
      'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30',
    iconClassName: 'text-red-600 dark:text-red-400',
  },
};

export function Callout({
  children,
  variant = 'info',
  title,
  className,
}: CalloutProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'my-6 flex gap-3 rounded-lg border p-4',
        config.className,
        className
      )}
    >
      <Icon
        className={cn('mt-0.5 h-5 w-5 flex-shrink-0', config.iconClassName)}
      />
      <div className="flex-1">
        {title && (
          <div className="mb-1 font-medium text-foreground">{title}</div>
        )}
        <div className="text-muted-foreground text-sm [&>p:last-child]:mb-0 [&>p]:mb-2">
          {children}
        </div>
      </div>
    </div>
  );
}
