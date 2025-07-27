import Link from 'next/link';
import { ChevronLeft } from '@/components/icons';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface TextPageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
  backLink?: {
    label: string;
    href: string;
  };
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';
}

export function TextPageLayout({
  children,
  title,
  description,
  breadcrumbs,
  backLink,
  className,
  maxWidth = '4xl',
}: TextPageLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className={cn('mx-auto', maxWidthClasses[maxWidth])}>
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.href}>
              {index < breadcrumbs.length - 1 ? (
                <>
                  <Link
                    className="text-muted-foreground transition-colors hover:text-primary"
                    href={crumb.href}
                  >
                    {crumb.label}
                  </Link>
                  <span className="mx-2 text-muted-foreground">/</span>
                </>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        {/* Page Header */}
        <header className="mb-8">
          <h1 className="mb-4 font-bold text-4xl text-foreground">{title}</h1>
          {description && (
            <p className="text-lg text-muted-foreground">{description}</p>
          )}
        </header>

        {/* Main Content */}
        <main
          className={cn(
            'prose prose-neutral dark:prose-invert max-w-none',
            'prose-headings:text-foreground prose-p:text-muted-foreground',
            'prose-code:text-foreground prose-strong:text-foreground',
            'prose-a:text-primary hover:prose-a:text-primary/80',
            'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground',
            className
          )}
        >
          {children}
        </main>

        {/* Back Navigation */}
        {backLink && (
          <footer className="mt-12 border-t pt-8">
            <Link
              className="inline-flex items-center gap-2 font-medium text-primary transition-colors hover:text-primary/80"
              href={backLink.href}
            >
              <ChevronLeft className="h-4 w-4" />
              {backLink.label}
            </Link>
          </footer>
        )}
      </div>
    </div>
  );
}
