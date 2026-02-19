import { useCallback, useEffect, useState } from 'react';
import type { Technique } from '@/lib/types';
import {
  enrichOptionsWithCounts,
  loadDynamicOptions,
} from '@/lib/wizard/options';
import type { QuestionOption, WizardQuestion } from '@/lib/wizard/types';

interface UseQuestionOptionsParams {
  question: WizardQuestion;
  filteredTechniques: Technique[];
  previousAnswer?: string;
  onAnswer: (answer: string | string[]) => void;
}

export function useQuestionOptions({
  question,
  filteredTechniques,
  previousAnswer,
  onAnswer,
}: UseQuestionOptionsParams) {
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
  const [options, setOptions] = useState<QuestionOption[]>([]);
  const [showAllOptions, setShowAllOptions] = useState(false);

  // Load and enrich options
  useEffect(() => {
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
    setSelectedValues(new Set());
  }, [question, filteredTechniques, previousAnswer]);

  const handleSelect = useCallback(
    (value: string) => {
      if (question.type === 'single') {
        onAnswer(value);
      } else {
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

  // Filter options based on showAllOptions toggle
  const visibleOptions = showAllOptions
    ? options
    : options.filter(
        (opt) =>
          opt.value === 'not-sure' || (opt.count !== undefined && opt.count > 0)
      );

  const hasHiddenOptions = options.length > visibleOptions.length;

  return {
    options,
    selectedValues,
    visibleOptions,
    hasHiddenOptions,
    showAllOptions,
    setShowAllOptions,
    handleSelect,
    handleSubmit,
  };
}
