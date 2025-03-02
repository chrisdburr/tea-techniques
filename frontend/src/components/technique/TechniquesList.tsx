// src/components/technique/TechniquesList.tsx
"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  useAssuranceGoals,
  calculateTotalPages,
  useTechniques,
  useCategoriesByAssuranceGoal
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
    applyFilters, 
    resetFilters, 
    changePage,
    currentPage
  } = useFilterParams(initialFilters);

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
  const { data: categoriesData } = useCategoriesByAssuranceGoal(filters.assurance_goal);
  const { data: assuranceGoalsData } = useAssuranceGoals();

  // We'll handle the category reset directly in the onValueChange handler
  // No need for useEffect here since it was causing infinite loop issues

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
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
          <Select
            value={filters.assurance_goal || "all"}
            onValueChange={(value) => {
              if (value !== filters.assurance_goal) {
                setFilter("assurance_goal", value);
                // When assurance goal changes, also reset category directly here
                setFilter("category", "all");
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
              if (value !== filters.category) {
                setFilter("category", value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
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
            <Button onClick={() => applyFilters()}>Apply Filters</Button>
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading techniques...</div>
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
                  onPageChange={changePage}
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {technique.name}
        </CardTitle>
        <CardDescription>
          {technique.category_name || "Uncategorized"}{" "}
          | {technique.model_dependency}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {technique.description}
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline">
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