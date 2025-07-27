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
                  className="transition-colors hover:text-primary"
                  href="/about/project-info"
                >
                  Project Information
                </a>
              </li>
              <li>
                <a
                  className="transition-colors hover:text-primary"
                  href="/about/tag-definitions"
                >
                  Tag Definitions
                </a>
              </li>
              <li>
                <a
                  className="transition-colors hover:text-primary"
                  href="/docs/developer-instructions"
                >
                  Developer Instructions
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-muted-foreground text-sm">
          <p>
            &copy; 2025 TEA Techniques. Built as a static site with Next.js.
          </p>
        </div>
      </div>
    </footer>
  );
}
