"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  BookOpen,
  FileText,
  Grid3X3,
  Search,
  Info,
  Hash,
  Code,
  Users,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useTags } from "@/lib/api/hooks";
import { useMemo } from "react";

interface NavigationItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  isExternal?: boolean;
  items?: {
    title: string;
    url: string;
    isExternal?: boolean;
  }[];
}

export function NavMain() {
  // Fetch categories (tags) from API
  const { data: tagsData, isLoading: isLoadingTags } = useTags();

  // Filter for category-type tags
  const categoryTags = useMemo(() => {
    if (!tagsData?.results) return [];

    // Group tags by technique-type category
    const techniqueTypeTags = tagsData.results
      .filter((tag) => (tag as any).category === "technique-type")
      .map((tag) => {
        // Extract display name from description or tag name
        const displayName =
          tag.description ||
          tag.name
            .split("/")
            .pop()
            ?.replace(/-/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ") ||
          tag.name;

        return {
          title: displayName,
          url: `/techniques?tags=${encodeURIComponent(tag.name)}`,
        };
      });

    return techniqueTypeTags;
  }, [tagsData]);

  // Build navigation items with dynamic categories
  const navigationItems: NavigationItem[] = useMemo(() => {
    const items: NavigationItem[] = [
      {
        title: "About",
        url: "/about",
        icon: Info,
        items: [
          {
            title: "Project Information",
            url: "/about/project-info",
          },
          {
            title: "Technique Evaluation",
            url: "/about/technique-evaluation",
          },
          {
            title: "Tag Definitions",
            url: "/about/tag-definitions",
          },
        ],
      },
      {
        title: "Technique Categories",
        url: "/categories",
        icon: Grid3X3,
        items: [
          {
            title: "Explainability",
            url: "/categories/explainability",
          },
          {
            title: "Fairness",
            url: "/categories/fairness",
          },
          {
            title: "Security",
            url: "/categories/security",
          },
          {
            title: "Privacy",
            url: "/categories/privacy",
          },
          {
            title: "Reliability",
            url: "/categories/reliability",
          },
          {
            title: "Safety",
            url: "/categories/safety",
          },
          {
            title: "Transparency",
            url: "/categories/transparency",
          },
        ],
      },
      {
        title: "Browse Techniques",
        url: "/techniques",
        icon: Search,
        isActive: true,
        items: [
          {
            title: "All Techniques",
            url: "/techniques",
          },
          {
            title: "By Assurance Goal",
            url: "/techniques?group=goal",
          },
          {
            title: "Recently Added",
            url: "/techniques?sort=recent",
          },
        ],
      },
      {
        title: "Documentation",
        url: "/docs",
        icon: BookOpen,
        items: [
          {
            title: "Developer Instructions",
            url: "/docs/developer-instructions",
          },
          {
            title: "Community Contributions",
            url: "/docs/community-contributions",
          },
          {
            title: "API Reference",
            url: "/swagger",
            isExternal: true,
          },
        ],
      },
    ];

    return items;
  }, [categoryTags, isLoadingTags]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {navigationItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            {item.items && item.items.length > 0 ? (
              <Collapsible
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          {subItem.isExternal ? (
                            <a
                              href={subItem.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <span>{subItem.title}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <Link
                              href={subItem.url}
                              className="flex items-center gap-2"
                            >
                              <span>{subItem.title}</span>
                              {isLoadingTags &&
                                item.title === "Technique Categories" && (
                                  <Loader2 className="h-3 w-3 animate-spin ml-auto" />
                                )}
                            </Link>
                          )}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
