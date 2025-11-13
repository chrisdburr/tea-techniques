'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { tagDefinitions } from '@/lib/data/tag-definitions';
import {
  getDimensionOrder,
  groupTagsByDimension,
  TAG_HIERARCHIES,
} from '@/lib/data/tag-hierarchies';

interface TagCategoryDisplayProps {
  category: string;
}

/**
 * Displays tags for a given category, automatically handling both
 * hierarchical (multi-dimensional) and flat tag structures.
 */
export function TagCategoryDisplay({ category }: TagCategoryDisplayProps) {
  // Get all tags for this category
  const categoryTags = Object.entries(tagDefinitions)
    .filter(([tag]) => {
      // For assurance-goal-category, match the specific goal
      if (category.startsWith('assurance-goal-category/')) {
        const goal = category.replace('assurance-goal-category/', '');
        return tag.startsWith(`assurance-goal-category/${goal}/`);
      }
      // For other categories, match the prefix
      return tag.startsWith(`${category}/`);
    })
    .sort((a, b) => a[0].localeCompare(b[0]));

  if (categoryTags.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No tags defined for this category.
      </p>
    );
  }

  // Check if this category has hierarchical structure
  const hierarchyKey = category.startsWith('assurance-goal-category/')
    ? category.replace('assurance-goal-category/', '')
    : category;

  const hasHierarchy = hierarchyKey in TAG_HIERARCHIES;

  if (hasHierarchy) {
    return (
      <HierarchicalTagDisplay
        category={category}
        hierarchyKey={hierarchyKey}
        tags={categoryTags.map(([tag]) => tag)}
      />
    );
  }

  // Flat display for non-hierarchical categories
  return <FlatTagDisplay tags={categoryTags} />;
}

/**
 * Displays hierarchical tags grouped by dimensions
 */
function HierarchicalTagDisplay({
  category,
  hierarchyKey,
  tags,
}: {
  category: string;
  hierarchyKey: string;
  tags: string[];
}) {
  const grouped = groupTagsByDimension(tags, hierarchyKey);
  const dimensionOrder = getDimensionOrder(hierarchyKey);

  return (
    <div className="space-y-6">
      {dimensionOrder.map((dimensionKey) => {
        const group = grouped[dimensionKey];
        if (!group || group.tags.length === 0) {
          return null;
        }

        const { config, tags: dimensionTags } = group;

        return (
          <div className="space-y-2" key={dimensionKey}>
            <div className="border-primary border-l-4 pl-3">
              <h4 className="font-semibold text-base">{config.name}</h4>
              {config.description && (
                <p className="mt-1 text-muted-foreground text-sm">
                  {config.description}
                </p>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[45%]">Tag</TableHead>
                  <TableHead>Definition</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dimensionTags
                  .sort((a, b) => a.localeCompare(b))
                  .map((tag) => {
                    const definition = tagDefinitions[tag];
                    // Calculate indentation level based on tag depth
                    const depth = tag.split('/').length;
                    const baseDepth = category.split('/').length + 1;
                    const indentLevel = Math.max(0, depth - baseDepth - 1);

                    return (
                      <TableRow key={tag}>
                        <TableCell
                          className="font-mono text-sm"
                          style={{ paddingLeft: `${indentLevel * 1.5 + 1}rem` }}
                        >
                          {tag}
                        </TableCell>
                        <TableCell className="text-sm">{definition}</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Displays flat list of tags in a simple table
 */
function FlatTagDisplay({ tags }: { tags: [string, string][] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40%]">Tag</TableHead>
          <TableHead>Definition</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tags.map(([tag, definition]) => (
          <TableRow key={tag}>
            <TableCell className="font-mono text-sm">{tag}</TableCell>
            <TableCell className="text-sm">{definition}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
