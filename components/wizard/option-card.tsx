import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { optionItemVariants } from '@/lib/wizard/animation-variants';
import type { QuestionOption } from '@/lib/wizard/types';

interface OptionCardProps {
  option: QuestionOption;
  isSelected: boolean;
  isHovered: boolean;
  isLoading: boolean;
  onSelect: (value: string) => void;
  onMouseEnter: (value: string) => void;
  onMouseLeave: () => void;
}

export function OptionCard({
  option,
  isSelected,
  isHovered,
  isLoading,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}: OptionCardProps) {
  const isNotSure = option.value === 'not-sure';

  return (
    <motion.div
      key={option.value}
      variants={optionItemVariants}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <button
        className={cn(
          'relative w-full cursor-pointer rounded-lg border-2 p-3 text-left transition-all sm:p-4',
          'min-h-[60px] hover:shadow-md sm:min-h-[auto]',
          isSelected
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50',
          isHovered && 'ring-2 ring-primary/20',
          isNotSure && 'border-dashed',
          isLoading && 'cursor-not-allowed opacity-50'
        )}
        disabled={isLoading}
        onClick={() => onSelect(option.value)}
        onMouseEnter={() => onMouseEnter(option.value)}
        onMouseLeave={onMouseLeave}
        type="button"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{option.label}</span>
              {option.count !== undefined && (
                <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs">
                  {option.count}
                </span>
              )}
            </div>
            {option.description && (
              <p className="mt-1 text-muted-foreground text-sm">
                {option.description}
              </p>
            )}
          </div>
          {isSelected && (
            <motion.div
              animate={{ scale: 1, opacity: 1 }}
              className="ml-2"
              initial={{ scale: 0, opacity: 0 }}
            >
              <Check className="h-5 w-5 text-primary" />
            </motion.div>
          )}
        </div>
      </button>
    </motion.div>
  );
}
