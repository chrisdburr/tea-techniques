// src/app/about/page.tsx
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, FileText, Hash, ArrowRight } from "lucide-react";

export default function AboutPage() {
  const aboutSections = [
    {
      title: "Project Information",
      description:
        "Learn about the TEA Techniques platform and its key features",
      icon: BookOpen,
      href: "/about/project-info",
    },
    {
      title: "Technique Evaluation",
      description: "Understanding how techniques are assessed and categorized",
      icon: FileText,
      href: "/about/technique-evaluation",
    },
    {
      title: "Tag Definitions",
      description: "Comprehensive guide to all tags and their meanings",
      icon: Hash,
      href: "/about/tag-definitions",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">About TEA Techniques</h1>
        <p className="text-muted-foreground text-lg">
          A platform for exploring techniques for evidencing claims about
          responsible design, development, and deployment of data-driven
          technologies.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {aboutSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.href}
              className="hover:shadow-lg transition-shadow"
            >
              <Link href={section.href} className="block h-full">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                  </div>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-primary">
                    <span className="text-sm">Learn more</span>
                    <ArrowRight className="h-4 w-4" />
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
