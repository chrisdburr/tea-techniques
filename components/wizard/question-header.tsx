import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatQuestionText } from '@/lib/wizard/options';
import type { WizardQuestion } from '@/lib/wizard/types';

interface QuestionHeaderProps {
  question: WizardQuestion;
  previousAnswer?: string;
}

export function QuestionHeader({
  question,
  previousAnswer,
}: QuestionHeaderProps) {
  const questionText = formatQuestionText(question.text, { previousAnswer });

  return (
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
                    {Object.entries(question.helpItems).map(([key, value]) => (
                      <div
                        className="text-primary-foreground text-xs"
                        key={key}
                      >
                        <span className="font-medium">{key}:</span>{' '}
                        <span className="opacity-90">{value}</span>
                      </div>
                    ))}
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
  );
}
