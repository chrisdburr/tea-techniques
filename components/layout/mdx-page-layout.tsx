import type { Metadata } from 'next';
import Link from 'next/link';
import { MDXTableOfContents } from '@/components/mdx/table-of-contents';
import type { MDXFrontmatter } from '@/lib/types/mdx';
import { cn } from '@/lib/utils';

interface MDXPageLayoutProps {
  children: React.ReactNode;
  frontmatter: MDXFrontmatter;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';
}

export function MDXPageLayout({
  children,
  frontmatter,
  className,
  maxWidth = '4xl',
}: MDXPageLayoutProps) {
  const { title, description, breadcrumbs, tableOfContents } = frontmatter;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
  };

  // Determine if ToC should be shown
  const showToC =
    tableOfContents === true ||
    (typeof tableOfContents === 'object' && tableOfContents.enabled !== false);

  // Extract ToC config if it's an object
  const tocConfig = typeof tableOfContents === 'object' ? tableOfContents : {};

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.href}>
            {index < breadcrumbs.length - 1 ? (
              <>
                <Link
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  href={crumb.href}
                >
                  {crumb.label}
                </Link>
                <span className="mx-2 text-muted-foreground">/</span>
              </>
            ) : (
              <span className="font-medium text-foreground">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div
        className={
          showToC ? 'grid grid-cols-1 gap-12 xl:grid-cols-[1fr_250px]' : ''
        }
      >
        {/* Main Content */}
        <div className={cn('mx-auto', !showToC && maxWidthClasses[maxWidth])}>
          {/* Page Header */}
          <header className="mb-8">
            <h1 className="mb-4 font-bold text-3xl text-foreground">{title}</h1>
            {description && (
              <p className="text-lg text-muted-foreground">{description}</p>
            )}
          </header>

          {/* MDX Content */}
          <main
            className={cn(
              'prose prose-neutral dark:prose-invert max-w-none',
              className
            )}
          >
            {children}
          </main>
        </div>

        {/* Table of Contents */}
        {showToC && (
          <div>
            <MDXTableOfContents
              maxLevel={tocConfig.maxLevel}
              selector={tocConfig.selector}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to generate metadata from frontmatter
export function generateMetadataFromFrontmatter(
  frontmatter: MDXFrontmatter
): Metadata {
  return {
    title: frontmatter.title,
    description: frontmatter.description,
  };
}
