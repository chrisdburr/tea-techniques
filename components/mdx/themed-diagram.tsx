'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface ThemedDiagramProps {
  name: string;
  alt: string;
  className?: string;
}

/**
 * Displays a Mermaid diagram that switches between light and dark versions
 * based on the current theme. Diagrams are pre-generated SVGs stored in
 * /public/images/diagrams/ with -light.svg and -dark.svg suffixes.
 */
export function ThemedDiagram({
  name,
  alt,
  className = '',
}: ThemedDiagramProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const isDark = mounted && resolvedTheme === 'dark';
  const theme = isDark ? 'dark' : 'light';
  const src = `${basePath}/images/diagrams/${name}-${theme}.svg`;

  // Using img instead of next/image because:
  // 1. SVGs don't benefit from next/image optimization
  // 2. We need dynamic src switching based on theme
  return (
    <figure className={`my-6 ${className}`}>
      {/* biome-ignore lint/performance/noImgElement: SVG with dynamic theme switching */}
      <img
        alt={alt}
        className="w-full rounded-lg border bg-background"
        src={src}
      />
    </figure>
  );
}
