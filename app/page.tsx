import Image from 'next/image';
import Link from 'next/link';
import { Database, FileText, Globe } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getAssetPath } from '@/lib/config';

export default function Home() {
  return (
    <div className="space-y-24 pb-16">
      {/* Hero Section with Split Layout */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Left side: Content */}
          <div className="max-w-2xl space-y-6">
            <h1 className="font-bold text-4xl leading-tight md:text-5xl lg:text-6xl">
              TEA Techniques Database
            </h1>
            <p className="text-muted-foreground text-xl">
              A platform for exploring techniques for evidencing claims about
              responsible design, development, and deployment of data-driven
              technologies.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button asChild size="lg">
                <Link href="/techniques">Explore Techniques</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="https://assuranceplatform.azurewebsites.net/">
                  Go to TEA Platform
                </Link>
              </Button>
            </div>
          </div>

          {/* Right side: Image showcase with shadow and border */}
          <div className="relative overflow-hidden rounded-lg border border-muted shadow-xl">
            <Image
              alt="TEA Techniques platform interface"
              className="w-full object-cover"
              height={500}
              priority
              src={getAssetPath('/hero.jpg')}
              width={800}
            />
          </div>
        </div>
      </section>

      {/* Features Section - Now with more spacing from the hero */}
      <section className="container mx-auto space-y-10 px-4">
        <div className="mb-8 text-center">
          <h2 className="font-bold text-3xl">Key Features</h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Tools and resources to help with ethical and responsible AI
            development
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-10">
          <Card className="h-full">
            <CardHeader>
              <FileText className="mb-2 h-12 w-12 text-primary" />
              <CardTitle>Structured Documentation</CardTitle>
              <CardDescription>
                Detailed descriptions and references for each technique
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Each technique includes comprehensive information about its
                purpose, limitations, and practical use cases.
              </p>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <Database className="mb-2 h-12 w-12 text-primary" />
              <CardTitle>Searchable Database</CardTitle>
              <CardDescription>
                Quickly find techniques that match your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Filter by assurance goals, categories, and specific criteria to
                discover appropriate techniques for your project. Use our
                interactive wizard to answer guided questions and receive
                personalised technique recommendations.
              </p>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <Globe className="mb-2 h-12 w-12 text-primary" />
              <CardTitle>Open Platform</CardTitle>
              <CardDescription>
                Access API documentation and contribute to the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                TEA Techniques is designed to be an open, collaborative resource
                for the Responsible AI community.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4">
        <div className="space-y-6 rounded-lg bg-muted/50 px-6 py-12 text-center">
          <h2 className="font-bold text-3xl">Ready to get started?</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-xl">
            Explore our database of techniques to help ensure your AI systems
            are trustworthy and ethical.
          </p>
          <div className="pt-4">
            <Button asChild size="lg">
              <Link href="/techniques">Explore Techniques</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
