'use client';

import { useEffect, useRef, useState } from 'react';
import TechniqueCard from '@/components/technique-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Technique } from '@/lib/types';

interface LazyTechniqueCardProps {
  technique: Technique;
  index: number;
}

export function LazyTechniqueCard({
  technique,
  index,
}: LazyTechniqueCardProps) {
  const [_isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load immediately for first 6 cards (above the fold)
    if (index < 6) {
      setIsVisible(true);
      setHasLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          // Add a small delay to simulate loading for better UX
          setTimeout(() => setHasLoaded(true), 100);
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before the card comes into view
        threshold: 0.1,
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [index, hasLoaded]);

  return (
    <div className="h-full" ref={cardRef}>
      {hasLoaded ? (
        <TechniqueCard technique={technique} />
      ) : (
        <TechniqueCardSkeleton />
      )}
    </div>
  );
}

function TechniqueCardSkeleton() {
  return (
    <div className="h-full">
      <div className="flex h-full flex-col space-y-3 rounded-lg border p-4">
        {/* Title skeleton */}
        <Skeleton className="h-6 w-3/4" />

        {/* Goal icons skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        {/* Description skeleton */}
        <div className="flex-grow space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Button skeleton */}
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}
