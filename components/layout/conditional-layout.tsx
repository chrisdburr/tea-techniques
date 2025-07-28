'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Footer } from '@/components/layout/footer';
import { HomepageHeader } from '@/components/layout/homepage-header';

// Lazy load the sidebar components for non-homepage routes
const SidebarLayout = dynamic(
  () =>
    import('./sidebar-layout').then((mod) => ({
      default: mod.SidebarLayout,
    })),
  {
    ssr: true,
  }
);

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomepage = pathname === '/';

  if (isHomepage) {
    return (
      <div className="flex min-h-screen flex-col">
        <HomepageHeader />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  return <SidebarLayout>{children}</SidebarLayout>;
}
