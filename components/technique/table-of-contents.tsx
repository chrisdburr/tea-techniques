'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  title: string;
}

interface TableOfContentsProps {
  sections: Section[];
}

export function TableOfContents({ sections }: TableOfContentsProps) {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      {
        rootMargin: '-20% 0px -70% 0px',
      }
    );

    for (const { id } of sections) {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    }

    return () => {
      for (const { id } of sections) {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      }
    };
  }, [sections]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; // Offset for fixed header
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-20 hidden xl:block">
      <nav className="space-y-1">
        <h4 className="mb-4 font-semibold text-sm">On this page</h4>
        <ul className="max-h-[calc(100vh-10rem)] space-y-2 overflow-y-auto text-sm">
          {sections.map(({ id, title }) => (
            <li key={id}>
              <a
                className={cn(
                  'block border-l-2 py-1 pl-4 transition-colors hover:text-foreground',
                  activeSection === id
                    ? 'border-primary font-medium text-foreground'
                    : 'border-transparent text-muted-foreground'
                )}
                href={`#${id}`}
                onClick={(e) => handleClick(e, id)}
              >
                {title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
