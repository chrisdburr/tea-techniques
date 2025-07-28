'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import GoalIcon from '@/components/ui/goal-icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Technique } from '@/lib/types';

interface TechniqueRelatedTableProps {
  relatedTechniques: Technique[];
}

export function TechniqueRelatedTable({
  relatedTechniques,
}: TechniqueRelatedTableProps) {
  if (!relatedTechniques || relatedTechniques.length === 0) {
    return null;
  }

  return (
    <section className="mb-12" id="related-techniques">
      <h2 className="mb-6 font-semibold text-2xl">Related Techniques</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[200px]">Assurance Goals</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {relatedTechniques.map((technique) => (
              <TableRow key={technique.slug}>
                <TableCell className="font-medium">
                  <Link
                    className="text-primary hover:underline"
                    href={`/techniques/${technique.slug}`}
                  >
                    {technique.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {technique.description}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {technique.assurance_goals.map((goal) => (
                      <Badge
                        className="flex items-center gap-1"
                        key={goal}
                        variant="secondary"
                      >
                        <GoalIcon goalName={goal} size={12} />
                        <span className="text-xs">{goal}</span>
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
