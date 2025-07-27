export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface TableOfContentsConfig {
  enabled?: boolean;
  selector?: string; // CSS selector for headings (default: 'h2, h3')
  maxLevel?: number; // Maximum heading level to include (default: 3)
}

export interface MDXFrontmatter {
  title: string;
  description: string;
  breadcrumbs: BreadcrumbItem[];
  publishedAt?: string;
  updatedAt?: string;
  layout?: 'text-page';
  tableOfContents?: TableOfContentsConfig | boolean; // true uses defaults
}

export interface MDXPageProps {
  frontmatter: MDXFrontmatter;
  children: React.ReactNode;
}
