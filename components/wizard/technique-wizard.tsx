'use client';

import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ChevronLeft, RotateCcw, X } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useWizard } from '@/lib/hooks/use-wizard';
import type { Technique } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  contentVariants,
  modalVariants,
  overlayVariants,
} from '@/lib/wizard/animation-variants';
import { WizardContent } from './wizard-content';

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
  const wizard = useWizard({ techniques, animationDelay: 300 });

  // Reset wizard when closed
  useEffect(() => {
    if (!isOpen) {
      wizard.reset();
    }
  }, [isOpen, wizard.reset]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <MotionConfig reducedMotion="user">
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
                  {wizard.currentFlow && (
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        animate={{ width: `${wizard.progress}%` }}
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="relative flex-1 overflow-y-auto p-4 sm:max-h-[60vh] sm:min-h-[400px] sm:p-6">
                  <AnimatePresence custom={wizard.direction} mode="wait">
                    <motion.div
                      animate="center"
                      className={cn(
                        'w-full',
                        wizard.isTransitioning && 'pointer-events-none'
                      )}
                      custom={wizard.direction}
                      exit="exit"
                      initial="enter"
                      key={wizard.currentFlow || 'entry'}
                      variants={contentVariants}
                    >
                      <WizardContent
                        currentFlow={wizard.currentFlow}
                        currentQuestion={wizard.currentQuestion}
                        filteredTechniques={wizard.filteredTechniques}
                        goBack={wizard.goBack}
                        isTransitioning={wizard.isTransitioning}
                        machineState={wizard.machineState}
                        restart={wizard.restart}
                        showResults={wizard.showResults}
                        startFlow={wizard.startFlow}
                        submitAnswer={wizard.submitAnswer}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="border-border border-t px-4 py-3 sm:px-6 sm:py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {wizard.currentFlow && (
                        <Button
                          className="h-10 px-3 text-sm sm:h-9 sm:px-3"
                          disabled={wizard.isTransitioning}
                          onClick={wizard.goBack}
                          size="default"
                          variant="outline"
                        >
                          <ChevronLeft className="mr-1 h-4 w-4" />
                          Back
                        </Button>
                      )}
                      {(wizard.currentFlow || wizard.showResults) && (
                        <Button
                          className="h-10 px-3 text-sm sm:h-9 sm:px-3"
                          disabled={wizard.isTransitioning}
                          onClick={wizard.restart}
                          size="default"
                          variant="ghost"
                        >
                          <RotateCcw className="mr-1 h-4 w-4" />
                          Start Over
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
