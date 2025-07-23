"use client";

import {
  Filter,
  ChevronRight,
  Target,
  Cpu,
  Database,
  Loader2,
  type LucideIcon,
} from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { useFilters } from "@/lib/context/filter-context";
import { useAssuranceGoals, useTags } from "@/lib/api/hooks";
import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

// Define filter sections structure
interface FilterOption {
  name: string;
  href: string;
  children?: FilterOption[];
}

interface FilterSection {
  name: string;
  icon: LucideIcon;
  filters: FilterOption[];
  isLoading?: boolean;
}

export function NavFilters() {
  const { filters, updateFilter } = useFilters();
  const searchParams = useSearchParams();

  // Fetch data from API
  const {
    data: goalsData,
    isLoading: isLoadingGoals,
    error: goalsError,
  } = useAssuranceGoals();
  const {
    data: tagsData,
    isLoading: isLoadingTags,
    error: tagsError,
  } = useTags();

  // Handle search input
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateFilter("search", e.target.value);
    },
    [updateFilter],
  );

  // Get current active filters from URL
  const currentAssuranceGoal = searchParams.get("assurance_goals");
  const currentTag = searchParams.get("tags");

  // Process assurance goals to create links
  const assuranceGoalsFilters = useMemo(() => {
    if (!goalsData?.results) return [];

    return goalsData.results.map((goal) => ({
      name: goal.name,
      href: `/techniques?assurance_goals=${goal.id}`,
    }));
  }, [goalsData]);

  // Process tags to categorize them based on their category field
  const processedTags = useMemo(() => {
    if (!tagsData?.results)
      return {
        applicableModels: [],
        dataRequirements: [],
        dataTypes: [],
        expertiseNeeded: [],
        lifecycleStage: [],
        techniqueType: [],
        evidenceType: [],
      };

    const categorizedTags = {
      applicableModels: [] as FilterOption[],
      dataRequirements: [] as FilterOption[],
      dataTypes: [] as FilterOption[],
      expertiseNeeded: [] as FilterOption[],
      lifecycleStage: [] as FilterOption[],
      techniqueType: [] as FilterOption[],
      evidenceType: [] as FilterOption[],
    };

    tagsData.results.forEach((tag) => {
      // Extract display name from the tag name (e.g., "applicable-models/agnostic" -> "Agnostic")
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

      const filterOption: FilterOption = {
        name: displayName,
        href: `/techniques?tags=${encodeURIComponent(tag.name)}`,
      };

      // Categorize based on the tag's category field
      const category = (tag as any).category || tag.name.split("/")[0];

      switch (category) {
        case "applicable-models":
          categorizedTags.applicableModels.push(filterOption);
          break;
        case "data-requirements":
          categorizedTags.dataRequirements.push(filterOption);
          break;
        case "data-types":
          categorizedTags.dataTypes.push(filterOption);
          break;
        case "expertise-needed":
          categorizedTags.expertiseNeeded.push(filterOption);
          break;
        case "lifecycle-stage":
          categorizedTags.lifecycleStage.push(filterOption);
          break;
        case "technique-type":
          categorizedTags.techniqueType.push(filterOption);
          break;
        case "evidence-type":
          categorizedTags.evidenceType.push(filterOption);
          break;
      }
    });

    return categorizedTags;
  }, [tagsData]);

  // Build filter sections with dynamic data
  const filterSections: FilterSection[] = useMemo(
    () => [
      {
        name: "Assurance Goals",
        icon: Target,
        filters: assuranceGoalsFilters,
        isLoading: isLoadingGoals,
      },
      {
        name: "Applicable Models",
        icon: Cpu,
        filters: processedTags.applicableModels,
        isLoading: isLoadingTags,
      },
      {
        name: "Data",
        icon: Database,
        filters: [
          {
            name: "Data Requirements",
            href: "#",
            children: processedTags.dataRequirements,
          },
          {
            name: "Data Types",
            href: "#",
            children: processedTags.dataTypes,
          },
        ],
        isLoading: isLoadingTags,
      },
      {
        name: "Additional Filters",
        icon: Filter,
        filters: [
          {
            name: "Expertise Needed",
            href: "#",
            children: processedTags.expertiseNeeded,
          },
          {
            name: "Lifecycle Stage",
            href: "#",
            children: processedTags.lifecycleStage,
          },
          {
            name: "Technique Type",
            href: "#",
            children: processedTags.techniqueType,
          },
          {
            name: "Evidence Type",
            href: "#",
            children: processedTags.evidenceType,
          },
        ],
        isLoading: isLoadingTags,
      },
    ],
    [assuranceGoalsFilters, processedTags, isLoadingGoals, isLoadingTags],
  );

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between px-2 mb-2">
        <SidebarGroupLabel>Filter Techniques</SidebarGroupLabel>
      </div>

      {/* Search Input */}
      <div className="px-2 mb-4">
        <Input
          type="search"
          placeholder="Search techniques..."
          value={filters.search}
          onChange={handleSearchChange}
          className="h-8"
        />
      </div>

      <SidebarMenu>
        {filterSections.map((section) => (
          <Collapsible
            key={section.name}
            defaultOpen={false}
            className="group/section"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={section.name}>
                  <section.icon className="h-4 w-4" />
                  <span>{section.name}</span>
                  {section.isLoading ? (
                    <Loader2 className="ml-auto h-3 w-3 animate-spin" />
                  ) : (
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/section:rotate-90" />
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {section.isLoading ? (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton className="opacity-50 cursor-not-allowed">
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        <span className="text-muted-foreground">
                          Loading...
                        </span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ) : (goalsError || tagsError) &&
                    section.filters.length === 0 ? (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton className="opacity-50 cursor-not-allowed">
                        <span className="text-muted-foreground text-xs">
                          Error loading options
                        </span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ) : section.filters.length === 0 ? (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton className="opacity-50 cursor-not-allowed">
                        <span className="text-muted-foreground">
                          No options available
                        </span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ) : (
                    section.filters.map((filter, filterIndex) => (
                      <div
                        key={`${section.name}-${filter.name}-${filterIndex}`}
                      >
                        {filter.children ? (
                          <Collapsible
                            className="group/filter"
                            defaultOpen={false}
                          >
                            <CollapsibleTrigger asChild>
                              <SidebarMenuSubButton className="w-full hover:bg-transparent cursor-default">
                                <span className="flex-1 text-muted-foreground">
                                  {filter.name}
                                </span>
                                <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]/filter:rotate-90" />
                              </SidebarMenuSubButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="ml-4 space-y-1">
                                {filter.children.map((child, childIndex) => (
                                  <SidebarMenuSubItem
                                    key={`${filter.name}-${child.name}-${childIndex}`}
                                  >
                                    <Link
                                      href={child.href}
                                      className={cn(
                                        "flex w-full items-center rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors",
                                        child.href.includes(currentTag || "") &&
                                          "bg-accent text-accent-foreground hover:bg-accent",
                                      )}
                                    >
                                      <span>{child.name}</span>
                                    </Link>
                                  </SidebarMenuSubItem>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ) : (
                          <SidebarMenuSubItem>
                            <Link
                              href={filter.href}
                              className={cn(
                                "flex w-full items-center rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors",
                                (filter.href.includes(
                                  `assurance_goals=${currentAssuranceGoal}`,
                                ) ||
                                  filter.href.includes(currentTag || "")) &&
                                  "bg-accent text-accent-foreground hover:bg-accent",
                              )}
                            >
                              <span>{filter.name}</span>
                            </Link>
                          </SidebarMenuSubItem>
                        )}
                      </div>
                    ))
                  )}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
