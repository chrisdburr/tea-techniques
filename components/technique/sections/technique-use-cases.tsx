import GoalIcon from '@/components/ui/goal-icon';
import type { ExampleUseCase, Technique } from '@/lib/types';

interface TechniqueUseCasesProps {
  technique: Technique;
}

export function TechniqueUseCases({ technique }: TechniqueUseCasesProps) {
  if (
    !technique.example_use_cases ||
    technique.example_use_cases.length === 0
  ) {
    return null;
  }

  // Group use cases by goal
  const useCasesByGoal = technique.example_use_cases.reduce(
    (acc, useCase) => {
      const goal = useCase.goal;
      if (!acc[goal]) {
        acc[goal] = [];
      }
      acc[goal].push(useCase);
      return acc;
    },
    {} as Record<string, ExampleUseCase[]>
  );

  return (
    <section className="mb-12" id="use-cases">
      <h2 className="mb-6 font-semibold text-2xl">Example Use Cases</h2>
      <div className="space-y-6">
        {Object.entries(useCasesByGoal).map(([goal, useCases]) => (
          <div key={goal}>
            <div className="mb-3 flex items-center gap-2">
              <GoalIcon goalName={goal} size={20} />
              <h3 className="font-semibold text-lg">{goal}</h3>
            </div>
            <div className="space-y-3 pl-7">
              {useCases.map((useCase, index) => (
                <div
                  className="rounded-lg border bg-muted/30 p-4"
                  key={`${goal}-${index}-${useCase.description.slice(0, 20)}`}
                >
                  <p className="text-muted-foreground">{useCase.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
