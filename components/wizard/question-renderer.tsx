'use client';

import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useQuestionOptions } from '@/lib/hooks/use-question-options';
import type { Technique } from '@/lib/types';
import { optionContainerVariants } from '@/lib/wizard/animation-variants';
import type { WizardQuestion } from '@/lib/wizard/types';
import { OptionCard } from './option-card';
import { QuestionHeader } from './question-header';

interface QuestionRendererProps {
  question: WizardQuestion;
  onAnswer: (answer: string | string[]) => void;
  filteredTechniques: Technique[];
  previousAnswer?: string;
  isLoading?: boolean;
}

export function QuestionRenderer({
  question,
  onAnswer,
  filteredTechniques,
  previousAnswer,
  isLoading = false,
}: QuestionRendererProps) {
  const {
    options,
    selectedValues,
    visibleOptions,
    hasHiddenOptions,
    showAllOptions,
    setShowAllOptions,
    handleSelect,
    handleSubmit,
  } = useQuestionOptions({
    question,
    filteredTechniques,
    previousAnswer,
    onAnswer,
  });

  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  // Handle arrow key navigation
  const handleArrowKey = useCallback(
    (direction: 'up' | 'down') => {
      const currentIndex = hoveredOption
        ? visibleOptions.findIndex((opt) => opt.value === hoveredOption)
        : -1;

      if (direction === 'down') {
        const nextIndex = (currentIndex + 1) % visibleOptions.length;
        setHoveredOption(visibleOptions[nextIndex].value);
      } else {
        const prevIndex =
          currentIndex <= 0 ? visibleOptions.length - 1 : currentIndex - 1;
        setHoveredOption(visibleOptions[prevIndex].value);
      }
    },
    [visibleOptions, hoveredOption]
  );

  // Handle Enter key separately to reduce complexity
  const handleEnterKey = useCallback(() => {
    if (hoveredOption) {
      handleSelect(hoveredOption);
    } else if (question.type === 'single' && visibleOptions.length === 1) {
      handleSelect(visibleOptions[0].value);
    } else if (question.type === 'multi' && selectedValues.size > 0) {
      handleSubmit();
    }
  }, [
    hoveredOption,
    handleSelect,
    question.type,
    visibleOptions,
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
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, hoveredOption, handleArrowKey, handleSelect, handleEnterKey]);

  return (
    <div className="w-full">
      <QuestionHeader previousAnswer={previousAnswer} question={question} />

      {/* Toggle for showing all options */}
      {hasHiddenOptions && (
        <div className="mb-4 flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              checked={showAllOptions}
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onChange={(e) => setShowAllOptions(e.target.checked)}
              type="checkbox"
            />
            <span className="text-muted-foreground">
              Show options with no results (
              {options.length - visibleOptions.length} hidden)
            </span>
          </label>
        </div>
      )}

      {/* Options */}
      <motion.div
        animate="visible"
        className="space-y-3"
        initial="hidden"
        variants={optionContainerVariants}
      >
        {visibleOptions.map((option) => (
          <OptionCard
            isHovered={hoveredOption === option.value}
            isLoading={isLoading}
            isSelected={
              question.type === 'single'
                ? false
                : selectedValues.has(option.value)
            }
            key={option.value}
            onMouseEnter={setHoveredOption}
            onMouseLeave={() => setHoveredOption(null)}
            onSelect={handleSelect}
            option={option}
          />
        ))}
      </motion.div>

      {/* Footer Actions */}
      {question.type === 'multi' && (
        <div className="mt-6 flex items-center justify-end gap-2">
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
