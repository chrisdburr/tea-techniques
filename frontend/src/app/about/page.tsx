// src/app/about/page.tsx
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight } from "lucide-react";
import { aboutTabs } from "@/components/about/AboutTabsConfig";

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold mb-4">About TEA Techniques</h1>
          <p className="text-muted-foreground text-lg">
            A platform for exploring techniques for evidencing claims about
            responsible design, development, and deployment of data-driven
            technologies.
          </p>
        </div>

        <Tabs defaultValue="project-info" className="w-full">
          <TabsList className="mb-6">
            {aboutTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2"
                >
                  <IconComponent className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {aboutTabs.map((tab) => {
            const ContentComponent = tab.content;
            return (
              <TabsContent key={tab.id} value={tab.id}>
                <ContentComponent />
              </TabsContent>
            );
          })}
        </Tabs>

        <div className="flex justify-center py-6">
          <Button asChild size="lg" className="gap-2">
            <Link href="/techniques">
              Explore Techniques
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
