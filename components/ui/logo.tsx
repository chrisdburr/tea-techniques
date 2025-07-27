'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 32 }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until hydrated to avoid SSR mismatch
  if (!mounted) {
    return (
      <div
        className={cn('rounded bg-muted', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <Image
      alt="TEA Techniques Logo"
      className={cn('object-contain', className)}
      height={size}
      src={
        resolvedTheme === 'dark'
          ? '/logo-dark-mode.png'
          : '/logo-light-mode.png'
      }
      width={size}
    />
  );
}
