import { ExternalLink } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  formatAuthors,
  formatPublicationDate,
  getResourceIcon,
  getResourceTypeLabel,
} from '@/lib/resource-utils';
import type { Resource, Technique } from '@/lib/types';

interface TechniqueResourcesProps {
  technique: Technique;
}

export function TechniqueResources({ technique }: TechniqueResourcesProps) {
  if (!technique.resources || technique.resources.length === 0) {
    return null;
  }

  // Ensure resources are objects (hydrated)
  const resources = technique.resources.filter(
    (r): r is Resource => typeof r !== 'string'
  );

  if (resources.length === 0) {
    return null;
  }

  // Group resources by type
  const groupedResources = resources.reduce(
    (acc, resource) => {
      const type = resource.source_type || 'other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(resource);
      return acc;
    },
    {} as Record<string, typeof resources>
  );

  // Order of groups
  const typeOrder = [
    'technical_paper',
    'software_package',
    'tutorial',
    'documentation',
    'other',
  ];

  return (
    <section className="mb-12" id="resources">
      <h2 className="mb-6 font-semibold text-2xl">Resources</h2>
      <div className="space-y-8">
        {typeOrder.map((type) => {
          const typeResources = groupedResources[type];
          if (!typeResources || typeResources.length === 0) {
            return null;
          }

          return (
            <div className="space-y-4" key={type}>
              <h3 className="font-medium text-lg text-muted-foreground capitalize">
                {getResourceTypeLabel(type as Resource['source_type'])}s
              </h3>
              <div className="grid gap-4">
                {typeResources.map((resource, index) => {
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
                            {authors && (
                              <>
                                <span>{authors}</span>
                                {date && <span className="text-xs">•</span>}
                              </>
                            )}
                            {date && <span>{date}</span>}
                          </div>

                          {resource.description && (
                            <p className="text-muted-foreground text-sm">
                              {resource.description}
                            </p>
                          )}
                          {resource.abstract && (
                            <p className="line-clamp-2 text-muted-foreground text-xs italic">
                              {resource.abstract}
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
                        <Button
                          className="group-hover:bg-background"
                          size="sm"
                          variant="secondary"
                        >
                          View Resource
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
