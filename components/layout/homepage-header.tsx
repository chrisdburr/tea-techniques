'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

const SearchModal = dynamic(
  () =>
    import('@/components/search/search-modal').then((mod) => ({
      default: mod.SearchModal,
    })),
  { ssr: false }
);

export function HomepageHeader() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link className="flex items-center gap-3 font-bold text-xl" href="/">
          <Logo size={32} />
          TEA Techniques
        </Link>

        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-8 font-medium text-sm md:flex">
            <Link
              className="text-foreground/90 transition-colors hover:text-foreground/80"
              href="/techniques"
            >
              Techniques
            </Link>
            <Link
              className="text-foreground/90 transition-colors hover:text-foreground/80"
              href="/categories"
            >
              Categories
            </Link>
            <Link
              className="text-foreground/90 transition-colors hover:text-foreground/80"
              href="/about"
            >
              About
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <SearchModal />

            <Button
              className="h-9 w-9"
              disabled={!mounted}
              onClick={() =>
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
              }
              size="icon"
              variant="ghost"
            >
              {mounted ? (
                resolvedTheme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )
              ) : (
                <div className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
