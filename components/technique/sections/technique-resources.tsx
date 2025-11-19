import { ExternalLink } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
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
              className="group flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50 md:flex-row md:items-start md:justify-between"
              key={`${resource.title}-${index}`}
            >
              <div className="flex flex-1 gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-background">
                  <ResourceIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-semibold text-foreground leading-none tracking-tight">
                      {resource.title}
                    </h5>
                  </div>

                  {/* Metadata line */}
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                    {resource.source_type && (
                      <Badge variant="outline" className="capitalize">
                        {getResourceTypeLabel(resource.source_type)}
                      </Badge>
                    )}
                    {authors && (
                      <>
                        <span className="text-xs">•</span>
                        <span>{authors}</span>
                      </>
                    )}
                    {date && (
                      <>
                        <span className="text-xs">•</span>
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
                <Button size="sm" variant="secondary" className="group-hover:bg-background">
                  View Resource
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
