import Link from 'next/link';
import type { Technique } from '@/lib/types';

interface TechniqueRelatedProps {
  relatedTechniques: Technique[];
}

export function TechniqueRelated({ relatedTechniques }: TechniqueRelatedProps) {
  if (!relatedTechniques || relatedTechniques.length === 0) {
    return null;
  }

  return (
    <section className="mb-12" id="related-techniques">
      <h2 className="mb-6 font-semibold text-2xl">Related Techniques</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {relatedTechniques.map((related) => (
          <Link
            className="block rounded-lg border p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
            href={`/techniques/${related.slug}`}
            key={related.slug}
          >
            <h5 className="mb-2 font-medium">{related.name}</h5>
            <p className="line-clamp-3 text-muted-foreground text-sm">
              {related.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
