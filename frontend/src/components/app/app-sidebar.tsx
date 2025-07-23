"use client";

import * as React from "react";
import { NavMain } from "@/components/app/nav-main";
import { NavFilters } from "@/components/app/nav-filters";
import { NavSettings } from "@/components/app/nav-settings";
import { AppHeader } from "@/components/app/app-header";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppHeader />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavFilters />
      </SidebarContent>
      <SidebarFooter>
        <NavSettings />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
