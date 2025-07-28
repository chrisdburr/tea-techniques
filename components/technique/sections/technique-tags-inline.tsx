import Link from 'next/link';
import {
  Blocks,
  Calendar,
  Database,
  FileText,
  Layers,
  Network,
  Settings,
  Users,
} from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { getTagUrlPart } from '@/lib/tag-utils';
import {
  formatTagCategory,
  formatTagName,
  groupTagsByCategory,
} from '@/lib/technique-utils';
import type { Technique } from '@/lib/types';

interface TechniqueTagsInlineProps {
  technique: Technique;
}

// Map categories to icons
const categoryIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  'applicable-models': Layers,
  'data-requirements': Database,
  'data-type': Database,
  'evidence-type': FileText,
  'expertise-needed': Users,
  'explanatory-scope': Network,
  'lifecycle-stage': Calendar,
  'technique-type': Settings,
};

function getCategoryIcon(category: string) {
  const Icon = categoryIcons[category] || Blocks;
  return Icon;
}

export function TechniqueTagsInline({ technique }: TechniqueTagsInlineProps) {
  if (!technique.tags || technique.tags.length === 0) {
    return null;
  }

  const tagsByCategory = groupTagsByCategory(technique.tags);

  // Filter tags by category, keeping only subcategory tags for assurance-goal-category
  const filteredTagsByCategory = Object.fromEntries(
    Object.entries(tagsByCategory)
      .map(([category, tags]) => {
        if (category === 'assurance-goal-category') {
          // Only show assurance-goal-category tags that have subcategories (3+ parts)
          const subcategoryTags = tags.filter((tag) => {
            const parts = tag.split('/');
            return parts.length >= 3; // e.g., assurance-goal-category/explainability/feature-analysis
          });
          return [category, subcategoryTags];
        }
        return [category, tags];
      })
      .filter(([, tags]) => (tags as string[]).length > 0) // Remove categories with no tags
  );

  if (Object.keys(filteredTagsByCategory).length === 0) {
    return null;
  }

  return (
    <section className="mb-12" id="tags">
      <h2 className="mb-6 font-semibold text-2xl">Tags</h2>
      <div className="space-y-3">
        {Object.entries(filteredTagsByCategory).map(([category, tags]) => {
          // For hierarchical tags, only show the most specific ones
          const uniqueTags = (tags as string[]).filter((tag) => {
            // Check if this tag is a parent of any other tag in the list
            return !(tags as string[]).some(
              (otherTag) => otherTag !== tag && otherTag.startsWith(`${tag}/`)
            );
          });

          const Icon = getCategoryIcon(category);

          return (
            <div className="flex flex-wrap items-center gap-2" key={category}>
              <div className="flex min-w-fit items-center gap-2 font-medium text-muted-foreground text-sm">
                <Icon className="h-4 w-4" />
                <span>{formatTagCategory(category)}:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {uniqueTags.map((tag: string) => {
                  // Get only the last part of the tag for display
                  const tagParts = tag.split('/');
                  const lastPart = tagParts.at(-1) ?? tag;
                  const displayName = formatTagName(lastPart);
                  const urlPart = getTagUrlPart(tag, category);

                  // For assurance-goal-category subcategories, link to categories instead of filters
                  const href =
                    category === 'assurance-goal-category' &&
                    tagParts.length >= 3
                      ? `/categories/${tagParts[1]}/${tagParts.slice(2).join('/')}`
                      : `/filters/${category}/${urlPart}`;

                  return (
                    <Link href={href} key={tag}>
                      <Badge
                        className="cursor-pointer hover:bg-secondary/80"
                        variant="secondary"
                      >
                        {displayName}
                      </Badge>
                    </Link>
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
