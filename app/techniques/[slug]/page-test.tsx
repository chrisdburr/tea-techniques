import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { generateTechniqueParams, getTechnique } from '@/lib/data';

interface TechniquePageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  const params = await generateTechniqueParams();
  // Only return first technique for testing
  return params.slice(0, 1);
}

export async function generateMetadata({
  params,
}: TechniquePageProps): Promise<Metadata> {
  const technique = await getTechnique(params.slug);

  if (!technique) {
    return {
      title: 'Technique Not Found - TEA Techniques',
    };
  }

  return {
    title: `${technique.name} - TEA Techniques`,
    description: technique.description,
  };
}

export default async function TechniquePage({ params }: TechniquePageProps) {
  const technique = await getTechnique(params.slug);

  if (!technique) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-4 font-bold text-4xl">{technique.name}</h1>
      <p className="text-lg text-muted-foreground">{technique.description}</p>
    </div>
  );
}
