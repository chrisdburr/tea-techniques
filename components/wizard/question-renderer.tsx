'use client';

import { motion } from 'framer-motion';
import { Check, HelpCircle, Info } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Technique } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  enrichOptionsWithCounts,
  formatQuestionText,
  loadDynamicOptions,
} from '@/lib/wizard/options';
import type { QuestionOption, WizardQuestion } from '@/lib/wizard/types';

interface QuestionRendererProps {
  question: WizardQuestion;
  onAnswer: (answer: string | string[]) => void;
  onBack: () => void;
  filteredTechniques: Technique[];
  previousAnswer?: string;
  isLoading?: boolean;
}

export function QuestionRenderer({
  question,
  onAnswer,
  onBack,
  filteredTechniques,
  previousAnswer,
  isLoading = false,
}: QuestionRendererProps) {
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
  const [options, setOptions] = useState<QuestionOption[]>([]);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  // Load and enrich options
  useEffect(() => {
    const loadOptions = () => {
      // Get base options
      let baseOptions = loadDynamicOptions(
        question,
        {
          currentFlow: '',
          currentQuestionIndex: 0,
          answers: previousAnswer ? { 'assurance-goal': previousAnswer } : {},
          path: [],
          remainingTechniques: filteredTechniques.length,
          skippedQuestions: [],
        },
        filteredTechniques
      );

      // If not dynamic, get static options and enrich with counts
      if (question.options !== 'dynamic' && question.options) {
        baseOptions = question.options;
        if (question.filterTag) {
          baseOptions = enrichOptionsWithCounts(
            baseOptions,
            question.filterTag,
            filteredTechniques
          );
        }
      }

      // Add "Not Sure" option if allowed
      if (question.allowNotSure) {
        const notSureOption: QuestionOption = {
          value: 'not-sure',
          label: question.notSureLabel || "Not sure / doesn't matter",
          count: filteredTechniques.length,
        };
        baseOptions = [...baseOptions, notSureOption];
      }

      setOptions(baseOptions);
    };

    loadOptions();
  }, [question, filteredTechniques, previousAnswer]);

  // Reset selection when question changes
  useEffect(() => {
    setSelectedValues(new Set());
  }, []);

  const handleSelect = useCallback(
    (value: string) => {
      if (question.type === 'single') {
        // For single select, submit immediately
        onAnswer(value);
      } else {
        // For multi-select, toggle selection
        const newSelection = new Set(selectedValues);
        if (newSelection.has(value)) {
          newSelection.delete(value);
        } else {
          newSelection.add(value);
        }
        setSelectedValues(newSelection);
      }
    },
    [question.type, selectedValues, onAnswer]
  );

  const handleSubmit = useCallback(() => {
    if (question.type === 'multi') {
      const values = Array.from(selectedValues);
      if (values.length > 0) {
        onAnswer(values);
      }
    }
  }, [question.type, selectedValues, onAnswer]);

  // Handle arrow key navigation
  const handleArrowKey = useCallback(
    (direction: 'up' | 'down') => {
      const currentIndex = hoveredOption
        ? options.findIndex((opt) => opt.value === hoveredOption)
        : -1;

      if (direction === 'down') {
        const nextIndex = (currentIndex + 1) % options.length;
        setHoveredOption(options[nextIndex].value);
      } else {
        const prevIndex =
          currentIndex <= 0 ? options.length - 1 : currentIndex - 1;
        setHoveredOption(options[prevIndex].value);
      }
    },
    [options, hoveredOption]
  );

  // Handle Enter key separately to reduce complexity
  const handleEnterKey = useCallback(() => {
    if (hoveredOption) {
      handleSelect(hoveredOption);
    } else if (question.type === 'single' && options.length === 1) {
      handleSelect(options[0].value);
    } else if (question.type === 'multi' && selectedValues.size > 0) {
      handleSubmit();
    }
  }, [
    hoveredOption,
    handleSelect,
    question.type,
    options,
    selectedValues.size,
    handleSubmit,
  ]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          handleArrowKey('down');
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleArrowKey('up');
          break;
        case 'Enter':
          e.preventDefault();
          handleEnterKey();
          break;
        case ' ':
          if (hoveredOption) {
            e.preventDefault();
            handleSelect(hoveredOption);
          }
          break;
        default:
          // Allow other keys to pass through
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, hoveredOption, handleArrowKey, handleSelect, handleEnterKey]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 10,
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

  const questionText = formatQuestionText(question.text, { previousAnswer });

  return (
    <div className="w-full">
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-lg">{questionText}</h3>
          {question.helpText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="h-6 w-6 p-0" size="sm" variant="ghost">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="mb-2 text-primary-foreground text-sm">
                    {question.helpText}
                  </p>
                  {question.helpItems && (
                    <div className="space-y-1">
                      {Object.entries(question.helpItems).map(
                        ([key, value]) => (
                          <div
                            className="text-primary-foreground text-xs"
                            key={key}
                          >
                            <span className="font-medium">{key}:</span>{' '}
                            <span className="opacity-90">{value}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {question.type === 'multi' && (
          <p className="mt-2 text-muted-foreground text-sm">
            Select all that apply
          </p>
        )}
      </div>

      {/* Options */}
      <motion.div
        animate="visible"
        className="space-y-3"
        initial="hidden"
        variants={containerVariants}
      >
        {options.map((option) => {
          const isSelected =
            question.type === 'single'
              ? false
              : selectedValues.has(option.value);
          const isHovered = hoveredOption === option.value;
          const isNotSure = option.value === 'not-sure';

          return (
            <motion.div
              key={option.value}
              variants={itemVariants}
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
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setHoveredOption(option.value)}
                onMouseLeave={() => setHoveredOption(null)}
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
        })}
      </motion.div>

      {/* Footer Actions */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          className="h-10 px-4 text-sm sm:h-9 sm:px-3"
          disabled={isLoading}
          onClick={onBack}
          size="default"
          variant="outline"
        >
          Back
        </Button>

        {question.type === 'multi' && (
          <div className="flex items-center gap-2">
            {selectedValues.size > 0 && (
              <span className="text-muted-foreground text-sm">
                {selectedValues.size} selected
              </span>
            )}
            <Button
              className="h-10 px-4 text-sm sm:h-9 sm:px-3"
              disabled={isLoading || selectedValues.size === 0}
              onClick={handleSubmit}
              size="default"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Helper Info */}
      {options.length === 0 && !isLoading && (
        <div className="mt-4 flex items-center gap-2 text-muted-foreground text-sm">
          <Info className="h-4 w-4" />
          <span>No options available based on current filters</span>
        </div>
      )}
    </div>
  );
}
