'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  Filter,
  Grid3X3,
  Home,
  Info,
  Library,
  type LucideIcon,
} from '@/components/icons';

const SearchModal = dynamic(
  () =>
    import('@/components/search/search-modal').then((mod) => ({
      default: mod.SearchModal,
    })),
  { ssr: false }
);

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';

interface NavigationItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
}

export function NavMain() {
  const { state } = useSidebar();

  const navigationItems: NavigationItem[] = [
    {
      title: 'Home',
      url: '/',
      icon: Home,
    },
    {
      title: 'About',
      url: '/about',
      icon: Info,
      items: [
        {
          title: 'Project Information',
          url: '/about/project-info',
        },
        {
          title: 'Technique Evaluation',
          url: '/about/technique-evaluation',
        },
        {
          title: 'Tag Definitions',
          url: '/about/tag-definitions',
        },
      ],
    },
    {
      title: 'Browse Techniques',
      url: '/techniques',
      icon: Library,
    },
    {
      title: 'Categories',
      url: '/categories',
      icon: Grid3X3,
      isActive: true,
      items: [
        {
          title: 'All Categories',
          url: '/categories',
        },
        {
          title: 'Explainability',
          url: '/categories/explainability',
        },
        {
          title: 'Fairness',
          url: '/categories/fairness',
        },
        {
          title: 'Privacy',
          url: '/categories/privacy',
        },
        {
          title: 'Reliability',
          url: '/categories/reliability',
        },
        {
          title: 'Safety',
          url: '/categories/safety',
        },
        {
          title: 'Security',
          url: '/categories/security',
        },
        {
          title: 'Transparency',
          url: '/categories/transparency',
        },
      ],
    },
    {
      title: 'Filters',
      url: '/filters',
      icon: Filter,
      items: [
        {
          title: 'All Filters',
          url: '/filters',
        },
        {
          title: 'Expertise Level',
          url: '/filters/expertise-needed',
        },
        {
          title: 'Lifecycle Stage',
          url: '/filters/lifecycle-stage',
        },
        {
          title: 'Applicable Models',
          url: '/filters/applicable-models',
        },
        {
          title: 'Technique Type',
          url: '/filters/technique-type',
        },
        {
          title: 'Data Type',
          url: '/filters/data-type',
        },
        {
          title: 'Evidence Type',
          url: '/filters/evidence-type',
        },
        {
          title: 'Data Requirements',
          url: '/filters/data-requirements',
        },
      ],
    },
    {
      title: 'Documentation',
      url: '/docs',
      icon: BookOpen,
      items: [
        {
          title: 'Data Serving (API)',
          url: '/docs/api-data-serving',
        },
        {
          title: 'Community Contributions',
          url: '/docs/community-contributions',
        },
      ],
    },
  ];

  // Add GitHub link as a separate item
  const githubItem: NavigationItem = {
    title: 'GitHub',
    url: 'https://github.com/alan-turing-institute/tea-techniques',
    icon: ExternalLink,
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {/* Search */}
        <SidebarMenuItem>
          <SearchModal />
        </SidebarMenuItem>

        {/* Navigation Items */}
        {navigationItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            {item.items && item.items.length > 0 ? (
              state === 'collapsed' ? (
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              ) : (
                <Collapsible
                  className="group/collapsible"
                  defaultOpen={item.isActive}
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
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              )
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

        {/* GitHub Link */}
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={githubItem.title}>
            <a href={githubItem.url} rel="noopener noreferrer" target="_blank">
              {githubItem.icon && <githubItem.icon />}
              <span>{githubItem.title}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
