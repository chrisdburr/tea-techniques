'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Technique } from '@/lib/types';
import type { WizardQuestion } from '@/lib/wizard/types';
import { WizardStateMachine } from '@/lib/wizard/wizard-machine';
import { EntrySelector } from './entry-selector';
import { QuestionRenderer } from './question-renderer';
import { WizardResults } from './wizard-results';

interface WizardPageWrapperProps {
  techniques: Technique[];
}

export function WizardPageWrapper({ techniques }: WizardPageWrapperProps) {
  const [wizardMachine] = useState(() => new WizardStateMachine(techniques));
  const [currentQuestion, setCurrentQuestion] = useState<WizardQuestion | null>(
    null
  );
  const [currentFlow, setCurrentFlow] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [filteredTechniques, setFilteredTechniques] = useState<Technique[]>([]);

  const startFlow = (flowId: string) => {
    setCurrentFlow(flowId);
    const question = wizardMachine.startFlow(flowId);
    setCurrentQuestion(question);
    setProgress(wizardMachine.getProgress());
  };

  const submitAnswer = (answer: string | string[]) => {
    const nextQuestion = wizardMachine.submitAnswer(answer);
    setProgress(wizardMachine.getProgress());

    if (!nextQuestion || wizardMachine.shouldShowResults()) {
      setFilteredTechniques(wizardMachine.getFilteredTechniques());
      setShowResults(true);
    } else {
      setCurrentQuestion(nextQuestion);
    }
  };

  const goBack = () => {
    if (showResults) {
      setShowResults(false);
      const state = wizardMachine.getState();
      if (state.path.length > 0) {
        const question = wizardMachine.getCurrentQuestion();
        setCurrentQuestion(question);
      }
    } else {
      const previousQuestion = wizardMachine.goBack();
      if (previousQuestion) {
        setCurrentQuestion(previousQuestion);
        setProgress(wizardMachine.getProgress());
      } else {
        // Back to entry point selection
        setCurrentFlow('');
        setCurrentQuestion(null);
      }
    }
  };

  const restart = () => {
    wizardMachine.reset();
    setCurrentQuestion(null);
    setCurrentFlow('');
    setShowResults(false);
    setProgress(0);
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-lg border bg-card p-8">
        {/* Progress Bar */}
        {currentFlow && !showResults && (
          <div className="mb-8">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="min-h-[400px]">
          {(() => {
            if (!currentFlow) {
              // Entry point selection
              return <EntrySelector onSelectEntry={startFlow} />;
            }
            if (showResults) {
              // Results display
              return (
                <WizardResults
                  onGoBack={goBack}
                  onRestart={restart}
                  state={wizardMachine.getState()}
                  techniques={filteredTechniques}
                />
              );
            }
            if (currentQuestion) {
              // Current question
              return (
                <QuestionRenderer
                  filteredTechniques={filteredTechniques}
                  onAnswer={submitAnswer}
                  onBack={goBack}
                  previousAnswer={
                    wizardMachine.getState().path.length > 0
                      ? String(wizardMachine.getState().path.at(-1)?.answer)
                      : undefined
                  }
                  question={currentQuestion}
                />
              );
            }
            return null;
          })()}
        </div>

        {/* Footer Navigation */}
        {(currentFlow || showResults) && (
          <div className="mt-8 flex items-center justify-between border-t pt-4">
            <Button asChild variant="ghost">
              <Link href="/">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            {(currentFlow || showResults) && (
              <Button onClick={restart} size="sm" variant="outline">
                Start Over
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
