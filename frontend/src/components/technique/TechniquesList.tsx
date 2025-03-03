// src/components/technique/TechniquesList.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  useAssuranceGoals,
  calculateTotalPages,
  useTechniques,
  useCategories
} from "@/lib/api/hooks";
import { useFilterParams } from "@/lib/hooks/useFilterParams";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { Technique, Category, AssuranceGoal } from "@/lib/types";

// Number of items per page - must match backend setting (20)
const PAGE_SIZE = 20;

// Initial filter values
const initialFilters = {
  search: "",
  assurance_goal: "all",
  category: "all"
};

export default function TechniquesList() {
  // Use custom filter hook to manage URL parameters
  const { 
    filters, 
    setFilter, 
    currentPage
  } = useFilterParams(initialFilters);
  
  // Fix hydration issues by tracking client-side rendering
  
  // Fetch data from API
  const { data: techniquesData, isLoading, error } = useTechniques(
    {
      search: filters.search,
      assurance_goal: filters.assurance_goal,
      category: filters.category,
    },
    currentPage
  );

  // Fetch filtered categories based on selected assurance goal
  const { data: categoriesData } = useCategories(
    filters.assurance_goal !== "all" ? parseInt(filters.assurance_goal) : undefined
  );
  const { data: assuranceGoalsData } = useAssuranceGoals();

  // Calculate pagination information
  const totalItems = techniquesData?.count || 0;
  const totalPages = calculateTotalPages(totalItems, PAGE_SIZE);

  // Access techniques data safely
  const techniques = techniquesData?.results || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Techniques</h1>
        <Button asChild>
          <Link href="/techniques/add">Add New Technique</Link>
        </Button>
      </div>

      <div className="bg-muted/30 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search techniques..."
            value={filters.search || ""}
            onChange={(e) => {
              const newValue = e.target.value;
              if (newValue !== filters.search) {
                setFilter("search", newValue);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // Build URL with current filters
                const params = new URLSearchParams();
                
                // Add search if provided
                if (filters.search) {
                  params.set("search", filters.search);
                }
                
                // Add assurance goal if set
                if (filters.assurance_goal && filters.assurance_goal !== "all") {
                  params.set("assurance_goals", filters.assurance_goal);
                }
                
                // Add category if set
                if (filters.category && filters.category !== "all") {
                  params.set("categories", filters.category);
                }
                
                // Always set page
                params.set("page", "1");
                
                // Navigate
                window.location.href = `/techniques?${params.toString()}`;
              }
            }}
          />
          <Select
            value={filters.assurance_goal || "all"}
            onValueChange={(value) => {
              if (value === "all") {
                window.location.href = "/techniques?page=1";
              } else {
                window.location.href = `/techniques?assurance_goals=${value}&page=1`;
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Assurance Goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Assurance Goals
              </SelectItem>
              {assuranceGoalsData?.results?.map(
                (goal: AssuranceGoal) => (
                  <SelectItem
                    key={goal.id}
                    value={goal.id.toString()}
                  >
                    {goal.name}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          <Select 
            value={filters.category || "all"} 
            onValueChange={(value) => {
              const params = new URLSearchParams();
              
              // Add category filter if not "all"
              if (value !== "all") {
                params.set("categories", value);
              }
              
              // Add assurance goal filter if it's set
              if (filters.assurance_goal && filters.assurance_goal !== "all") {
                params.set("assurance_goals", filters.assurance_goal);
              }
              
              // Always set page
              params.set("page", "1");
              
              // Navigate to filtered URL
              window.location.href = `/techniques?${params.toString()}`;
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Categories
              </SelectItem>
              {categoriesData?.results?.map((cat: Category) => (
                <SelectItem
                  key={cat.id}
                  value={cat.id.toString()}
                >
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button onClick={() => {
              // Build URL with all current filters
              const params = new URLSearchParams();
              
              // Add search if provided
              if (filters.search) {
                params.set("search", filters.search);
              }
              
              // Add assurance goal if set
              if (filters.assurance_goal && filters.assurance_goal !== "all") {
                params.set("assurance_goals", filters.assurance_goal);
              }
              
              // Add category if set
              if (filters.category && filters.category !== "all") {
                params.set("categories", filters.category);
              }
              
              params.set("page", "1");
              
              // Navigate to filtered URL
              window.location.href = `/techniques?${params.toString()}`;
            }}>
              Apply Filters
            </Button>
            <Button variant="outline" onClick={() => {
              // Direct navigation to reset
              window.location.href = "/techniques?page=1";
            }}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading techniques...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <p>Error loading techniques: {(error as Error).message}</p>
          <p className="mt-2">
            Please check that the backend is running and properly
            configured.
          </p>
        </div>
      ) : (
        <>
          {techniques.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {techniques.map((technique: Technique) => (
                  <TechniqueCard 
                    key={technique.id} 
                    technique={technique} 
                  />
                ))}
              </div>

              {/* Only show pagination if we have more than one page */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(newPage) => {
                    // Build URL with current filters and new page
                    const params = new URLSearchParams();
                    
                    // Add search if provided
                    if (filters.search) {
                      params.set("search", filters.search);
                    }
                    
                    // Add assurance goal if set
                    if (filters.assurance_goal && filters.assurance_goal !== "all") {
                      params.set("assurance_goals", filters.assurance_goal);
                    }
                    
                    // Add category if set
                    if (filters.category && filters.category !== "all") {
                      params.set("categories", filters.category);
                    }
                    
                    // Set the new page parameter
                    params.set("page", newPage.toString());
                    
                    // Navigate to new page
                    window.location.href = `/techniques?${params.toString()}`;
                  }}
                  className="mt-8"
                />
              )}
            </>
          ) : (
            <EmptyState />
          )}
        </>
      )}
      
    </div>
  );
}

// Extracted components
function TechniqueCard({ technique }: { technique: Technique }) {
  // Get first category and goal names for display in card
  const primaryCategory = technique.categories.length > 0 
    ? technique.categories[0].name 
    : "Uncategorized";
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="line-clamp-2">
          {technique.name}
        </CardTitle>
        <CardDescription>
          {primaryCategory} | {technique.model_dependency}
          {technique.assurance_goals.length > 1 && " | Multiple Goals"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm text-muted-foreground mb-3">
          {technique.description}
        </p>
        
        <div className="flex flex-wrap gap-2">
          {technique.assurance_goals.slice(0, 3).map((goal) => (
            <Badge key={goal.id} variant="outline">
              {goal.name}
            </Badge>
          ))}
          {technique.assurance_goals.length > 3 && (
            <Badge variant="outline">+{technique.assurance_goals.length - 3} more</Badge>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="mt-auto">
        <Button asChild variant="default" className="w-full">
          <Link href={`/techniques/${technique.id}`}>
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-8">
      <p>No techniques found matching your criteria.</p>
      <p className="mt-2 text-sm text-muted-foreground">
        This could be because:
      </p>
      <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground">
        <li>No techniques exist in the database yet</li>
        <li>
          The current filters exclude all techniques
        </li>
      </ul>
    </div>
  );
}