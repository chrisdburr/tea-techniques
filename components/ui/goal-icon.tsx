'use client';

import type React from 'react';
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
import { cn } from '@/lib/utils';

// Mapping of goal names to their corresponding icons
export const goalIconsMap = {
  Explainability: Brain,
  Fairness: Scale,
  Security: Shield,
  Safety: ShieldCheck,
  Reliability: CheckCircle,
  Transparency: Eye,
  Privacy: Lock,
} as const;

interface GoalIconProps {
  goalName: string;
  className?: string;
  size?: number;
}

export const GoalIcon: React.FC<GoalIconProps> = ({
  goalName,
  className,
  size = 20,
}) => {
  // Format goal name to match our mapping (capitalize first letter)
  const formattedGoalName = goalName
    ? goalName.charAt(0).toUpperCase() + goalName.slice(1).toLowerCase()
    : '';

  // Get the icon component from our mapping, or use the default
  const IconComponent =
    goalIconsMap[formattedGoalName as keyof typeof goalIconsMap] || HelpCircle;

  return <IconComponent className={cn('shrink-0', className)} size={size} />;
};

export default GoalIcon;
