'use client';

import { motion } from 'framer-motion';
import { Cpu, Target, Wrench } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EntrySelectorProps {
  onSelectEntry: (flowId: string) => void;
  isLoading?: boolean;
}

const entryOptions = [
  {
    id: 'by-goal',
    title: 'I know my assurance goal',
    description: 'Start with what you want to achieve',
    details: 'Explainability, fairness, safety, privacy, etc.',
    icon: Target,
    iconEmoji: '🎯',
    estimatedQuestions: '3-4 questions',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'hover:border-blue-500/50',
  },
  {
    id: 'by-model',
    title: 'I know my model type',
    description: 'Start with your AI/ML model',
    details: 'Neural network, LLM, traditional ML, etc.',
    icon: Cpu,
    iconEmoji: '🤖',
    estimatedQuestions: '3-4 questions',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'hover:border-purple-500/50',
  },
  {
    id: 'by-technique',
    title: 'I know the technique type',
    description: 'Start with the kind of method',
    details: 'Metrics, testing, documentation, etc.',
    icon: Wrench,
    iconEmoji: '🔧',
    estimatedQuestions: '2-3 questions',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'hover:border-green-500/50',
  },
];

export function EntrySelector({
  onSelectEntry,
  isLoading = false,
}: EntrySelectorProps) {
  // Animation variants for stagger effect
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h3 className="mb-2 font-medium text-lg">
          How would you like to find techniques?
        </h3>
        <p className="text-muted-foreground text-sm">
          Choose the starting point that best matches what you know
        </p>
      </div>

      <motion.div
        animate="visible"
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
        initial="hidden"
        variants={containerVariants}
      >
        {entryOptions.map((option) => {
          const Icon = option.icon;

          return (
            <motion.div
              key={option.id}
              variants={itemVariants}
              whileHover={isLoading ? {} : { scale: 1.02 }}
              whileTap={isLoading ? {} : { scale: 0.98 }}
            >
              <Card
                className={cn(
                  'relative cursor-pointer transition-all duration-200',
                  'border-2 hover:shadow-lg',
                  option.borderColor,
                  isLoading && 'cursor-not-allowed opacity-50'
                )}
                onClick={() => !isLoading && onSelectEntry(option.id)}
              >
                <CardHeader className="pb-3">
                  <div className="mb-3 flex items-start justify-between">
                    <div className={cn('rounded-lg p-3', option.bgColor)}>
                      <Icon className={cn('h-6 w-6', option.color)} />
                    </div>
                  </div>
                  <CardTitle className="font-semibold text-base">
                    {option.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {option.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-2 text-muted-foreground text-xs">
                    {option.details}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-muted-foreground text-xs">
                      {option.estimatedQuestions}
                    </span>
                    <motion.div
                      animate={{ opacity: 1, x: 0 }}
                      className="text-muted-foreground text-xs"
                      initial={{ opacity: 0, x: -10 }}
                      transition={{ delay: 0.3 }}
                    >
                      →
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
