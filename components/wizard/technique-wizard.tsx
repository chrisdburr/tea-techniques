'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Technique } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { WizardQuestion } from '@/lib/wizard/types';
import { WizardStateMachine } from '@/lib/wizard/wizard-machine';
import { EntrySelector } from './entry-selector';
import { QuestionRenderer } from './question-renderer';
import { WizardResults } from './wizard-results';

interface TechniqueWizardProps {
  isOpen: boolean;
  onClose: () => void;
  techniques: Technique[];
  onSelectTechnique?: (technique: Technique) => void;
}

export function TechniqueWizard({
  isOpen,
  onClose,
  techniques,
}: TechniqueWizardProps) {
  const [wizardMachine, setWizardMachine] = useState(
    () => new WizardStateMachine(techniques)
  );
  const [currentQuestion, setCurrentQuestion] = useState<WizardQuestion | null>(
    null
  );
  const [currentFlow, setCurrentFlow] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [filteredTechniques, setFilteredTechniques] = useState<Technique[]>([]);

  // Update wizard machine when techniques change
  useEffect(() => {
    if (techniques.length > 0) {
      setWizardMachine(new WizardStateMachine(techniques));
    }
  }, [techniques]);

  // Reset wizard when closed
  useEffect(() => {
    if (!isOpen) {
      wizardMachine.reset();
      setCurrentQuestion(null);
      setCurrentFlow('');
      setShowResults(false);
      setProgress(0);
    }
  }, [isOpen, wizardMachine]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        return;
      }

      // Prevent default for certain keys to avoid conflicts
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === '?' && e.shiftKey) {
        // Trigger help modal (to be implemented)
        e.preventDefault();
        // setShowHelp(true);
      } else if (e.key === 'Tab') {
        // Allow natural Tab navigation
        // The browser handles this by default
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const startFlow = useCallback(
    (flowId: string) => {
      setDirection('forward');
      setIsTransitioning(true);
      setCurrentFlow(flowId);

      setTimeout(() => {
        const question = wizardMachine.startFlow(flowId);
        setCurrentQuestion(question);
        setProgress(wizardMachine.getProgress());
        const filtered = wizardMachine.getFilteredTechniques();
        setFilteredTechniques(filtered);
        setIsTransitioning(false);
      }, 300);
    },
    [wizardMachine]
  );

  const submitAnswer = useCallback(
    (answer: string | string[]) => {
      setDirection('forward');
      setIsTransitioning(true);

      setTimeout(() => {
        const nextQuestion = wizardMachine.submitAnswer(answer);
        setProgress(wizardMachine.getProgress());
        setFilteredTechniques(wizardMachine.getFilteredTechniques());

        if (!nextQuestion || wizardMachine.shouldShowResults()) {
          setShowResults(true);
        } else {
          setCurrentQuestion(nextQuestion);
        }
        setIsTransitioning(false);
      }, 300);
    },
    [wizardMachine]
  );

  const goBack = useCallback(() => {
    setDirection('backward');
    setIsTransitioning(true);

    setTimeout(() => {
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
      setIsTransitioning(false);
    }, 300);
  }, [wizardMachine, showResults]);

  const restart = useCallback(() => {
    setDirection('forward');
    setIsTransitioning(true);

    setTimeout(() => {
      wizardMachine.reset();
      setCurrentQuestion(null);
      setCurrentFlow('');
      setShowResults(false);
      setProgress(0);
      setIsTransitioning(false);
    }, 300);
  }, [wizardMachine]);

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        duration: 0.5,
        bounce: 0.3,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.3,
      },
    },
  };

  const contentVariants = {
    enter: (dir: 'forward' | 'backward') => ({
      x: dir === 'forward' ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (dir: 'forward' | 'backward') => ({
      x: dir === 'forward' ? -300 : 300,
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            animate="visible"
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
            exit="hidden"
            initial="hidden"
            onClick={onClose}
            variants={overlayVariants}
          />

          {/* Modal */}
          <motion.div
            animate="visible"
            className="fixed inset-0 z-[10000] flex items-center justify-center p-0 sm:p-4"
            exit="hidden"
            initial="hidden"
            variants={overlayVariants}
          >
            <motion.div
              animate="visible"
              className={cn(
                'relative w-full bg-background shadow-xl',
                'overflow-hidden border border-border',
                'h-full sm:h-auto sm:max-w-2xl sm:rounded-lg'
              )}
              exit="exit"
              initial="hidden"
              onClick={(e) => e.stopPropagation()}
              variants={modalVariants}
            >
              {/* Header */}
              <div className="relative border-border border-b px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg sm:text-xl">
                    Find the Right Technique
                  </h2>
                  <Button
                    className="h-10 w-10 p-0 sm:h-8 sm:w-8"
                    onClick={onClose}
                    size="sm"
                    variant="ghost"
                  >
                    <X className="h-5 w-5 sm:h-4 sm:w-4" />
                  </Button>
                </div>

                {/* Progress bar */}
                {currentFlow && (
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="relative flex-1 overflow-y-auto p-4 sm:max-h-[60vh] sm:min-h-[400px] sm:p-6">
                <AnimatePresence custom={direction} mode="wait">
                  <motion.div
                    animate="center"
                    className={cn(
                      'w-full',
                      isTransitioning && 'pointer-events-none'
                    )}
                    custom={direction}
                    exit="exit"
                    initial="enter"
                    key={currentFlow || 'entry'}
                    variants={contentVariants}
                  >
                    {(() => {
                      if (!currentFlow) {
                        // Entry point selection
                        return (
                          <EntrySelector
                            isLoading={isTransitioning}
                            onSelectEntry={startFlow}
                          />
                        );
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
                        const wizardState = wizardMachine.getState();
                        return (
                          <QuestionRenderer
                            filteredTechniques={filteredTechniques}
                            isLoading={isTransitioning}
                            onAnswer={submitAnswer}
                            onBack={goBack}
                            previousAnswer={
                              wizardState.path.length > 0
                                ? String(wizardState.path.at(-1)?.answer)
                                : undefined
                            }
                            question={currentQuestion}
                          />
                        );
                      }
                      return null;
                    })()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="border-border border-t px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {currentFlow && (
                      <Button
                        className="h-10 px-3 text-sm sm:h-9 sm:px-3"
                        disabled={isTransitioning}
                        onClick={goBack}
                        size="default"
                        variant="outline"
                      >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Back
                      </Button>
                    )}
                    {(currentFlow || showResults) && (
                      <Button
                        className="h-10 px-3 text-sm sm:h-9 sm:px-3"
                        disabled={isTransitioning}
                        onClick={restart}
                        size="default"
                        variant="ghost"
                      >
                        <RotateCcw className="mr-1 h-4 w-4" />
                        Start Over
                      </Button>
                    )}
                  </div>

                  {/* Results navigation handled within WizardResults component */}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
