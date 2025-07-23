import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Code, Users, ExternalLink, ArrowRight } from "lucide-react";

export default function DocsPage() {
  const docsSections = [
    {
      title: "Developer Instructions",
      description: "Setup guide and project structure for developers",
      icon: Code,
      href: "/docs/developer-instructions",
      isExternal: false,
    },
    {
      title: "Community Contributions",
      description: "How to contribute to the TEA Techniques project",
      icon: Users,
      href: "/docs/community-contributions",
      isExternal: false,
    },
    {
      title: "API Reference",
      description: "Interactive API documentation with Swagger",
      icon: ExternalLink,
      href: "/swagger",
      isExternal: true,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Documentation</h1>
        <p className="text-muted-foreground text-lg">
          Everything you need to know about developing with and contributing to
          the TEA Techniques platform.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {docsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.href}
              className="hover:shadow-lg transition-shadow"
            >
              <Link
                href={section.href}
                className="block h-full"
                target={section.isExternal ? "_blank" : undefined}
                rel={section.isExternal ? "noopener noreferrer" : undefined}
              >
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                  </div>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-primary">
                    <span className="text-sm">
                      {section.isExternal ? "Open documentation" : "Learn more"}
                    </span>
                    {section.isExternal ? (
                      <ExternalLink className="h-4 w-4" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </div>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
