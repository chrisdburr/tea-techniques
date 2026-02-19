'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useWizard } from '@/lib/hooks/use-wizard';
import type { Technique } from '@/lib/types';
import { WizardContent } from './wizard-content';

interface WizardPageWrapperProps {
  techniques: Technique[];
}

export function WizardPageWrapper({ techniques }: WizardPageWrapperProps) {
  const wizard = useWizard({ techniques, animationDelay: 0 });

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-lg border bg-card p-8">
        {/* Progress Bar */}
        {wizard.currentFlow && !wizard.showResults && (
          <div className="mb-8">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${wizard.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="min-h-[400px]">
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
        </div>

        {/* Footer Navigation */}
        {(wizard.currentFlow || wizard.showResults) && (
          <div className="mt-8 flex items-center justify-between border-t pt-4">
            <Button asChild variant="ghost">
              <Link href="/">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button onClick={wizard.restart} size="sm" variant="outline">
              Start Over
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
