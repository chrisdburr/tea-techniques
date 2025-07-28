import Link from 'next/link';
import type { LucideIcon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface IndexPageChildItem {
  title: string;
  description: string;
  href: string;
  icon?: LucideIcon;
  badge?: string;
  count?: number;
  additionalInfo?: string[];
  buttonText?: string;
}

interface IndexPageLayoutProps {
  title: string;
  description: string;
  items?: IndexPageChildItem[];
  additionalSections?: React.ReactNode;
  gridCols?: 2 | 3;
  className?: string;
  contentFirst?: boolean;
}

export function IndexPageLayout({
  title,
  description,
  items = [],
  additionalSections,
  gridCols = 2,
  className,
  contentFirst = false,
}: IndexPageLayoutProps) {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={cn('container mx-auto px-4 py-8', className)}>
      <div className="mx-auto max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-4 font-bold text-3xl text-foreground">{title}</h1>
          <p className="text-lg text-muted-foreground">{description}</p>
        </div>

        {/* Conditional Content Rendering */}
        {contentFirst ? (
          <>
            {/* Additional Sections First */}
            {additionalSections}

            {/* Children Cards Grid */}
            {items.length > 0 && (
              <div className={cn('grid gap-6', gridClasses[gridCols])}>
                {items.map((child) => {
                  const Icon = child.icon;
                  // If this card has a button, render it without the overlay link
                  if (child.buttonText || child.additionalInfo?.length) {
                    return (
                      <Card
                        className="h-full transition-shadow hover:shadow-lg"
                        key={child.href}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {Icon && (
                                <div className="rounded-lg bg-primary/10 p-2">
                                  <Icon className="h-5 w-5 text-primary" />
                                </div>
                              )}
                              <div>
                                <CardTitle className="text-xl">
                                  {child.title}
                                </CardTitle>
                                {child.badge && (
                                  <Badge className="mt-1" variant="secondary">
                                    {child.badge}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <CardDescription className="mt-3">
                            {child.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {child.additionalInfo?.length && (
                              <div>
                                <h4 className="mb-2 font-medium">
                                  Topics covered:
                                </h4>
                                <ul className="space-y-1 text-muted-foreground text-sm">
                                  {child.additionalInfo.map((info) => (
                                    <li
                                      className="flex items-center gap-2"
                                      key={info}
                                    >
                                      <div className="h-1 w-1 rounded-full bg-primary" />
                                      {info}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {child.buttonText && (
                              <Button asChild className="w-full">
                                <Link href={child.href}>
                                  {child.buttonText}
                                </Link>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  // Simple clickable card with overlay link
                  return (
                    <Link
                      className="block transition-transform hover:scale-[1.02]"
                      href={child.href}
                      key={child.href}
                    >
                      <Card className="flex h-full flex-col transition-shadow hover:shadow-lg">
                        <CardHeader className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {Icon && (
                                <div className="rounded-lg bg-primary/10 p-2">
                                  <Icon className="h-5 w-5 text-primary" />
                                </div>
                              )}
                              <div>
                                <CardTitle className="text-xl">
                                  {child.title}
                                </CardTitle>
                                {child.badge && (
                                  <Badge className="mt-1" variant="secondary">
                                    {child.badge}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <CardDescription className="mt-3">
                            {child.description}
                          </CardDescription>
                        </CardHeader>
                        {child.count !== undefined && (
                          <CardContent>
                            <div className="flex items-center justify-end">
                              <span className="font-medium text-primary text-sm">
                                View {child.count} technique
                                {child.count !== 1 ? 's' : ''} →
                              </span>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Children Cards Grid First */}
            {items.length > 0 && (
              <div className={cn('mb-12 grid gap-6', gridClasses[gridCols])}>
                {items.map((child) => {
                  const Icon = child.icon;
                  // If this card has a button, render it without the overlay link
                  if (child.buttonText || child.additionalInfo?.length) {
                    return (
                      <Card
                        className="h-full transition-shadow hover:shadow-lg"
                        key={child.href}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {Icon && (
                                <div className="rounded-lg bg-primary/10 p-2">
                                  <Icon className="h-5 w-5 text-primary" />
                                </div>
                              )}
                              <div>
                                <CardTitle className="text-xl">
                                  {child.title}
                                </CardTitle>
                                {child.badge && (
                                  <Badge className="mt-1" variant="secondary">
                                    {child.badge}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <CardDescription className="mt-3">
                            {child.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {child.additionalInfo?.length && (
                              <div>
                                <h4 className="mb-2 font-medium">
                                  Topics covered:
                                </h4>
                                <ul className="space-y-1 text-muted-foreground text-sm">
                                  {child.additionalInfo.map((info) => (
                                    <li
                                      className="flex items-center gap-2"
                                      key={info}
                                    >
                                      <div className="h-1 w-1 rounded-full bg-primary" />
                                      {info}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {child.buttonText && (
                              <Button asChild className="w-full">
                                <Link href={child.href}>
                                  {child.buttonText}
                                </Link>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  // Simple clickable card with overlay link
                  return (
                    <Link
                      className="block transition-transform hover:scale-[1.02]"
                      href={child.href}
                      key={child.href}
                    >
                      <Card className="flex h-full flex-col transition-shadow hover:shadow-lg">
                        <CardHeader className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {Icon && (
                                <div className="rounded-lg bg-primary/10 p-2">
                                  <Icon className="h-5 w-5 text-primary" />
                                </div>
                              )}
                              <div>
                                <CardTitle className="text-xl">
                                  {child.title}
                                </CardTitle>
                                {child.badge && (
                                  <Badge className="mt-1" variant="secondary">
                                    {child.badge}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <CardDescription className="mt-3">
                            {child.description}
                          </CardDescription>
                        </CardHeader>
                        {child.count !== undefined && (
                          <CardContent>
                            <div className="flex items-center justify-end">
                              <span className="font-medium text-primary text-sm">
                                View {child.count} technique
                                {child.count !== 1 ? 's' : ''} →
                              </span>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Additional Sections */}
            {additionalSections}
          </>
        )}
      </div>
    </div>
  );
}
