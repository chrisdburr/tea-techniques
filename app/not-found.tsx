import Link from 'next/link';
import { FileQuestion, Home, Search } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="container mx-auto px-4">
        <Card className="mx-auto max-w-2xl border-none shadow-none">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="mb-8">
              <FileQuestion className="mx-auto h-24 w-24 text-muted-foreground/50" />
            </div>

            <h1 className="mb-4 font-bold text-4xl text-foreground">
              404 - Page Not Found
            </h1>

            <p className="mx-auto mb-8 max-w-md text-muted-foreground text-xl">
              Sorry, we couldn't find the page you're looking for. It may have
              been moved or doesn't exist.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/">
                <Button className="gap-2" size="lg">
                  <Home className="h-4 w-4" />
                  Return Home
                </Button>
              </Link>

              <Link href="/techniques">
                <Button className="gap-2" size="lg" variant="outline">
                  <Search className="h-4 w-4" />
                  Browse Techniques
                </Button>
              </Link>
            </div>

            <div className="mt-12 border-t pt-8">
              <p className="mb-4 text-muted-foreground text-sm">
                Here are some helpful links:
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link
                  className="text-primary hover:underline"
                  href="/categories"
                >
                  Categories
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link className="text-primary hover:underline" href="/filters">
                  Filters
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link className="text-primary hover:underline" href="/about">
                  About
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link
                  className="text-primary hover:underline"
                  href="/docs/community-contributions"
                >
                  Contribute
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
