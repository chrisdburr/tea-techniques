'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
  ChevronsUpDown,
  Monitor,
  Moon,
  Settings,
  Sun,
} from '@/components/icons';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function NavSettings() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip="Settings"
            >
              <Settings />
              <span>Settings</span>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side="right"
            sideOffset={4}
          >
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {mounted && theme === 'dark' && <Moon className="h-4 w-4" />}
                  {mounted && theme === 'light' && <Sun className="h-4 w-4" />}
                  {mounted && theme === 'system' && (
                    <Monitor className="h-4 w-4" />
                  )}
                  {!mounted && <div className="h-4 w-4" />}
                  <span>Theme</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme('light')}>
                      <Sun className="h-4 w-4" />
                      <span>Light</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')}>
                      <Moon className="h-4 w-4" />
                      <span>Dark</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('system')}>
                      <Monitor className="h-4 w-4" />
                      <span>System</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
