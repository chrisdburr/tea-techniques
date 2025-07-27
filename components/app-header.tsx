'use client';

import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function AppHeader() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="hover:bg-transparent md:h-8 md:p-0"
          size="lg"
        >
          <Link href="/">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
              <Logo size={24} />
            </div>
            <div className="flex flex-1 text-left text-base leading-tight">
              <span className="truncate font-bold">TEA Techniques</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
