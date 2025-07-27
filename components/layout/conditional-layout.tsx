'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
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
      <div className="min-h-screen">
        <HomepageHeader />
        <main>{children}</main>
      </div>
    );
  }

  return <SidebarLayout>{children}</SidebarLayout>;
}
