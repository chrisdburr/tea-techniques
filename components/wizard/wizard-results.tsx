'use client';

import { motion } from 'framer-motion';
import { ChevronRight, RefreshCw, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Technique } from '@/lib/types';
import {
  calculateMatchScore,
  getMatchReasons,
  sortTechniquesByRelevance,
} from '@/lib/wizard/filters';
import type { WizardState } from '@/lib/wizard/types';
import { WizardResultCard } from './wizard-result-card';

interface WizardResultsProps {
  techniques: Technique[];
  state: WizardState;
  onGoBack: () => void;
  onRestart: () => void;
}

export function WizardResults({
  techniques,
  state,
  onGoBack,
  onRestart,
}: WizardResultsProps) {
  // Sort and categorize techniques
  const sortedTechniques = useMemo(() => {
    const sorted = sortTechniquesByRelevance(techniques, state);
    return sorted.map((technique) => ({
      technique,
      score: calculateMatchScore(technique, state),
      reasons: getMatchReasons(technique, state),
    }));
  }, [techniques, state]);

  // Split into best matches and others
  const bestMatches = sortedTechniques.filter((item) => item.score >= 80);
  const otherResults = sortedTechniques.filter((item) => item.score < 80);

  // Format the filter path for display
  const filterPath = useMemo(() => {
    return state.path.map((item) => {
      const answer = Array.isArray(item.answer)
        ? item.answer.join(', ')
        : item.answer;
      return {
        question: item.question.replace(/-/g, ' '),
        answer,
      };
    });
  }, [state.path]);

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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  // Edge cases
  if (techniques.length === 0) {
    return (
      <div className="py-12 text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          className="mb-4 inline-block"
          transition={{ duration: 0.5 }}
        >
          <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground" />
        </motion.div>
        <h3 className="mb-2 font-semibold text-lg">No matching techniques</h3>
        <p className="mb-6 text-muted-foreground">
          Try adjusting your criteria or starting over with a different
          approach.
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={onGoBack} variant="outline">
            Go Back
          </Button>
          <Button onClick={onRestart}>Start Over</Button>
        </div>
      </div>
    );
  }

  if (techniques.length === 1) {
    const singleResult = sortedTechniques[0];
    return (
      <div className="py-8">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          className="mb-4 text-center"
          transition={{ duration: 0.5 }}
        >
          <Sparkles className="mx-auto h-12 w-12 text-yellow-500" />
        </motion.div>
        <h3 className="mb-4 text-center font-semibold text-lg">
          Perfect match found!
        </h3>
        <div className="mx-auto max-w-2xl">
          <WizardResultCard
            matchReasons={singleResult.reasons}
            matchScore={singleResult.score}
            technique={singleResult.technique}
          />
          <div className="mt-4">
            {singleResult.reasons.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 font-medium text-sm">Why this matches:</p>
                <div className="flex flex-wrap gap-2">
                  {singleResult.reasons.map((reason) => (
                    <Badge key={reason} variant="secondary">
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button className="flex-1" onClick={onRestart} variant="outline">
                Find Another
              </Button>
              <Link
                className="flex-1"
                href={`/techniques/${singleResult.technique.slug}`}
              >
                <Button className="w-full">
                  View Details
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h3 className="mb-2 font-semibold text-lg">
          Found {techniques.length} matching technique
          {techniques.length !== 1 ? 's' : ''}
        </h3>

        {/* Filter Path */}
        <div className="mb-4">
          <p className="mb-2 text-muted-foreground text-sm">Your criteria:</p>
          <div className="flex flex-wrap gap-2">
            {filterPath.map((item, index) => (
              <div
                className="flex items-center gap-1"
                key={`${item.question}-${item.answer}`}
              >
                <Badge variant="outline">
                  <span className="capitalize">{item.answer}</span>
                </Badge>
                {index < filterPath.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-muted-foreground text-sm">
          {techniques.length > 15 && 'Showing most relevant results'}
        </p>
      </div>

      {/* Results */}
      {
        <motion.div
          animate="visible"
          initial="hidden"
          variants={containerVariants}
        >
          {/* Best Matches Section */}
          {bestMatches.length > 0 && (
            <div className="mb-8">
              <h4 className="mb-4 font-medium">Best Matches</h4>
              <div className="space-y-4">
                {bestMatches.map((item) => (
                  <motion.div key={item.technique.slug} variants={itemVariants}>
                    <WizardResultCard
                      matchReasons={item.reasons}
                      matchScore={item.score}
                      technique={item.technique}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Other Results */}
          {otherResults.length > 0 && (
            <div>
              {bestMatches.length > 0 && (
                <h4 className="mb-4 font-medium">Other Results</h4>
              )}
              <div className="space-y-4">
                {otherResults.slice(0, 12).map((item) => (
                  <motion.div key={item.technique.slug} variants={itemVariants}>
                    <WizardResultCard
                      matchReasons={item.reasons}
                      matchScore={item.score}
                      technique={item.technique}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      }

      {/* Footer Actions */}
      <div className="mt-8 flex justify-between">
        <Button onClick={onGoBack} variant="outline">
          Refine Results
        </Button>
        <Button onClick={onRestart} variant="ghost">
          <RefreshCw className="mr-2 h-4 w-4" />
          Start Over
        </Button>
      </div>

      {/* Too Many Results Notice */}
      {techniques.length > 15 && (
        <p className="mt-4 text-center text-muted-foreground text-sm">
          Showing top 12 results. Consider refining your criteria for more
          specific recommendations.
        </p>
      )}
    </div>
  );
}
