import type { Technique } from '@/lib/types';

interface TechniqueLimitationsProps {
  technique: Technique;
}

export function TechniqueLimitations({ technique }: TechniqueLimitationsProps) {
  if (!technique.limitations || technique.limitations.length === 0) {
    return null;
  }

  return (
    <section className="mb-12" id="limitations">
      <h2 className="mb-6 font-semibold text-2xl">Limitations</h2>
      <ul className="space-y-3">
        {technique.limitations.map((limitation, index) => (
          <li
            className="flex items-start gap-3"
            key={`${limitation.description.slice(0, 50)}-${index}`}
          >
            <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground">
              {limitation.description}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
