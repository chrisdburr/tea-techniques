import type { Technique } from '@/lib/types';
import type { WizardQuestion, WizardState } from '@/lib/wizard/types';
import { EntrySelector } from './entry-selector';
import { QuestionRenderer } from './question-renderer';
import { WizardResults } from './wizard-results';

interface WizardContentProps {
  currentFlow: string;
  currentQuestion: WizardQuestion | null;
  showResults: boolean;
  isTransitioning: boolean;
  filteredTechniques: Technique[];
  machineState: WizardState;
  startFlow: (flowId: string) => void;
  submitAnswer: (answer: string | string[]) => void;
  goBack: () => void;
  restart: () => void;
}

export function WizardContent({
  currentFlow,
  currentQuestion,
  showResults,
  isTransitioning,
  filteredTechniques,
  machineState,
  startFlow,
  submitAnswer,
  goBack,
  restart,
}: WizardContentProps) {
  if (!currentFlow) {
    return (
      <EntrySelector isLoading={isTransitioning} onSelectEntry={startFlow} />
    );
  }

  if (showResults) {
    return (
      <WizardResults
        onGoBack={goBack}
        onRestart={restart}
        state={machineState}
        techniques={filteredTechniques}
      />
    );
  }

  if (currentQuestion) {
    const previousAnswer =
      machineState.path.length > 0
        ? String(machineState.path.at(-1)?.answer)
        : undefined;

    return (
      <QuestionRenderer
        filteredTechniques={filteredTechniques}
        isLoading={isTransitioning}
        onAnswer={submitAnswer}
        previousAnswer={previousAnswer}
        question={currentQuestion}
      />
    );
  }

  return null;
}
