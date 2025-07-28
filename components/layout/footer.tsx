import { ExternalLink } from '@/components/icons';

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-4 font-semibold text-foreground">
              TEA Techniques
            </h3>
            <p className="text-muted-foreground text-sm">
              Explore techniques for responsible AI design, development, and
              deployment.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <a
                  className="transition-colors hover:text-primary"
                  href="/techniques"
                >
                  All Techniques
                </a>
              </li>
              <li>
                <a
                  className="transition-colors hover:text-primary"
                  href="/categories"
                >
                  Categories
                </a>
              </li>
              <li>
                <a
                  className="transition-colors hover:text-primary"
                  href="/about"
                >
                  About
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">Resources</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <a
                  className="flex items-center gap-2 transition-colors hover:text-primary"
                  href="https://github.com/alan-turing-institute/tea-techniques"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>GitHub</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-muted-foreground text-sm">
          <p>&copy; 2025 Alan Turing Institute. Built using Next.js.</p>
        </div>
      </div>
    </footer>
  );
}
