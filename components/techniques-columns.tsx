'use client';

import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { ArrowUpDown } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import GoalIcon from '@/components/ui/goal-icon';
import {
  extractApplicableModels,
  extractDataTypes,
  extractTechniqueType,
  truncateDescription,
} from '@/lib/technique-utils';
import type { Technique } from '@/lib/types';

export const columns: ColumnDef<Technique>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          className="h-auto p-0 font-semibold hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          variant="ghost"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const technique = row.original;
      return (
        <Link
          className="font-medium text-primary hover:underline"
          href={`/techniques/${technique.slug}`}
        >
          {technique.name}
        </Link>
      );
    },
  },
  {
    accessorKey: 'assurance_goals',
    header: 'Goals',
    cell: ({ row }) => {
      const technique = row.original;
      return (
        <div className="flex flex-wrap gap-1">
          {technique.assurance_goals?.map((goal) => (
            <div
              className="inline-flex items-center justify-center rounded-full bg-secondary p-1.5"
              key={goal}
              title={goal}
            >
              <GoalIcon goalName={goal} size={16} />
            </div>
          ))}
        </div>
      );
    },
  },
  {
    id: 'type',
    header: ({ column }) => {
      return (
        <Button
          className="h-auto p-0 font-semibold hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          variant="ghost"
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    accessorFn: (row) => extractTechniqueType(row) || 'Unknown',
    cell: ({ row }) => {
      const type = extractTechniqueType(row.original);
      if (!type) {
        return null;
      }

      return (
        <Badge className="whitespace-nowrap" variant="secondary">
          {type}
        </Badge>
      );
    },
  },
  {
    id: 'models',
    header: 'Models',
    cell: ({ row }) => {
      const models = extractApplicableModels(row.original);
      const displayModels = models.slice(0, 2);
      const remainingCount = models.length - 2;

      return (
        <div className="flex flex-wrap gap-1">
          {displayModels.map((model) => (
            <Badge className="text-xs" key={model} variant="outline">
              {model}
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge className="text-xs" variant="outline">
              +{remainingCount}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: 'dataTypes',
    header: 'Data Types',
    cell: ({ row }) => {
      const dataTypes = extractDataTypes(row.original);

      return (
        <div className="flex flex-wrap gap-1">
          {dataTypes.map((dataType) => (
            <Badge className="text-xs" key={dataType} variant="outline">
              {dataType}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      const technique = row.original;
      return (
        <div className="max-w-[500px]">
          <span
            className="text-muted-foreground text-sm"
            title={technique.description}
          >
            {truncateDescription(technique.description)}
          </span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const technique = row.original;

      return (
        <Link href={`/techniques/${technique.slug}`}>
          <Button size="sm" variant="ghost">
            View
          </Button>
        </Link>
      );
    },
  },
];
