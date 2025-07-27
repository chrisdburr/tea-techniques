import Link from 'next/link';
import type { Technique } from '@/lib/types';

interface TechniqueBreadcrumbProps {
  technique: Technique;
}

export function TechniqueBreadcrumb({ technique }: TechniqueBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm">
      <ol className="flex items-center space-x-2">
        <li>
          <Link className="text-muted-foreground hover:text-primary" href="/">
            Home
          </Link>
        </li>
        <li>
          <span className="mx-2 text-muted-foreground">/</span>
        </li>
        <li>
          <Link
            className="text-muted-foreground hover:text-primary"
            href="/techniques"
          >
            Techniques
          </Link>
        </li>
        <li>
          <span className="mx-2 text-muted-foreground">/</span>
        </li>
        <li>
          <span aria-current="page" className="text-foreground">
            {technique.name}
          </span>
        </li>
      </ol>
    </nav>
  );
}
