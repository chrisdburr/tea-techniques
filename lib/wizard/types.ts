import type { Technique } from '@/lib/types';

export interface WizardEntryPoint {
  id: string;
  title: string;
  description: string;
  icon: string;
  startQuestion: string;
}

export interface QuestionOption {
  value: string;
  label: string;
  count?: number;
  description?: string;
}

export interface WizardQuestion {
  id: string;
  text: string;
  helpText?: string;
  helpItems?: Record<string, string>;
  type: 'single' | 'multi';
  filterTag?: string;
  options?: QuestionOption[] | 'dynamic';
  allowNotSure?: boolean;
  notSureLabel?: string;
  conditional?: boolean;
  skipIfUniform?: boolean;
  minOptionsForDisplay?: number;
}

export interface WizardFlow {
  id: string;
  questions: string[];
  adaptiveOrdering?: boolean;
}

export interface WizardConfig {
  entryPoints: WizardEntryPoint[];
  questions: Record<string, WizardQuestion>;
  flows: Record<string, WizardFlow>;
  resultsConfig: {
    minResults: number;
    idealResults: number;
    maxResults: number;
  };
}

export interface WizardState {
  currentFlow: string;
  currentQuestionIndex: number;
  answers: Record<string, string | string[]>;
  path: Array<{ question: string; answer: string | string[] }>;
  remainingTechniques: number;
  skippedQuestions: string[];
}

export interface FilterContext {
  techniques: Technique[];
  answers: Record<string, string | string[]>;
  currentQuestion?: string;
}
