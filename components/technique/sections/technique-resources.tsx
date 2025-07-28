import { ExternalLink } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  formatAuthors,
  formatPublicationDate,
  getResourceIcon,
  getResourceTypeLabel,
} from '@/lib/resource-utils';
import type { Technique } from '@/lib/types';

interface TechniqueResourcesProps {
  technique: Technique;
}

export function TechniqueResources({ technique }: TechniqueResourcesProps) {
  if (!technique.resources || technique.resources.length === 0) {
    return null;
  }

  return (
    <section className="mb-12" id="resources">
      <h2 className="mb-6 font-semibold text-2xl">Resources</h2>
      <div className="space-y-4">
        {technique.resources.map((resource, index) => {
          const ResourceIcon = getResourceIcon(resource.source_type);
          const authors = formatAuthors(resource.authors);
          const date = formatPublicationDate(resource.publication_date);

          return (
            <div
              className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-start md:justify-between"
              key={`${resource.title}-${index}`}
            >
              <div className="flex flex-1 gap-3">
                <div className="flex-shrink-0">
                  <ResourceIcon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <h5 className="font-medium text-foreground">
                    {resource.title}
                  </h5>

                  {/* Metadata line */}
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                    {resource.source_type && (
                      <span className="font-medium">
                        {getResourceTypeLabel(resource.source_type)}
                      </span>
                    )}
                    {authors && (
                      <>
                        <span>•</span>
                        <span>{authors}</span>
                      </>
                    )}
                    {date && (
                      <>
                        <span>•</span>
                        <span>{date}</span>
                      </>
                    )}
                  </div>

                  {resource.description && (
                    <p className="text-muted-foreground text-sm">
                      {resource.description}
                    </p>
                  )}
                </div>
              </div>
              <a
                className="flex-shrink-0"
                href={resource.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Button size="sm" variant="outline">
                  View
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}
