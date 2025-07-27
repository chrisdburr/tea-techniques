import type { Technique } from '@/lib/types';

interface TechniqueDescriptionProps {
  technique: Technique;
}

export function TechniqueDescription({ technique }: TechniqueDescriptionProps) {
  return (
    <section className="mb-12" id="description">
      <h2 className="mb-4 font-semibold text-2xl">Description</h2>
      <p className="text-lg text-muted-foreground leading-relaxed">
        {technique.description}
      </p>
    </section>
  );
}
