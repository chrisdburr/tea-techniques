"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ArrowLeftFromLine, Filter, Search } from "lucide-react";
import { AssuranceGoal, Category } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import GoalIcon from "./GoalIcon";
import CategoryTag from "./CategoryTag";

export interface FilterState {
	search: string;
	assurance_goals: string[];
	categories: string[];
	model_dependency: string[];
	complexity_min?: number;
	complexity_max?: number;
	computational_cost_min?: number;
	computational_cost_max?: number;
}

interface TechniquesSidebarProps {
	// Filter state
	filters: FilterState;
	setFilters: (filters: FilterState) => void;
	applyFilters: () => void;
	resetFilters: () => void;

	// Data for populating filters
	assuranceGoals?: AssuranceGoal[];
	categories?: Category[];
	isDataLoading: boolean;

	// Mobile state
	isMobileOpen: boolean;
	setIsMobileOpen: (isOpen: boolean) => void;
}

export const TechniquesSidebar: React.FC<TechniquesSidebarProps> = ({
	filters,
	setFilters,
	applyFilters,
	resetFilters,
	assuranceGoals = [],
	categories = [],
	isDataLoading,
	isMobileOpen,
	setIsMobileOpen,
}) => {
	// Toggle sidebar on mobile
	const toggleSidebar = () => {
		setIsMobileOpen(!isMobileOpen);
	};

	// Helper to update a specific filter value
	const updateFilter = <K extends keyof FilterState>(
		key: K,
		value: FilterState[K]
	) => {
		setFilters({ ...filters, [key]: value });
	};

	// Helper to toggle an item in an array filter
	const toggleArrayFilter = (key: keyof FilterState, itemId: string) => {
		const currentValues = filters[key] as string[];
		const newValues = currentValues.includes(itemId)
			? currentValues.filter((id) => id !== itemId)
			: [...currentValues, itemId];

		updateFilter(key, newValues as FilterState[typeof key]);
	};

	return (
		<div
			className={`
      fixed inset-y-0 left-0 z-20 w-80 bg-background border-r border-border transform transition-transform duration-200 ease-in-out
      ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
      md:relative md:translate-x-0 md:w-full md:border-0
    `}
		>
			{/* Mobile toggle button */}
			<div className="absolute right-0 top-4 translate-x-full md:hidden">
				<Button
					variant="outline"
					size="sm"
					className="rounded-l-none border-l-0"
					onClick={toggleSidebar}
					aria-label={isMobileOpen ? "Close filters" : "Open filters"}
				>
					{isMobileOpen ? (
						<ArrowLeftFromLine className="h-4 w-4" />
					) : (
						<Filter className="h-4 w-4" />
					)}
				</Button>
			</div>

			{/* Sidebar header */}
			<div className="p-4 border-b flex items-center justify-between">
				<h2 className="font-semibold text-lg">Filters</h2>
				<Button variant="outline" size="sm" onClick={resetFilters}>
					Reset
				</Button>
			</div>

			{/* Filters */}
			<div className="overflow-y-auto h-[calc(100%-60px)] py-2">
				{/* Search */}
				<div className="p-4">
					<div className="relative">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search techniques..."
							value={filters.search}
							onChange={(e) =>
								updateFilter("search", e.target.value)
							}
							className="w-full pl-8"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									applyFilters();
								}
							}}
						/>
					</div>
				</div>

				<Accordion
					type="multiple"
					defaultValue={[
						"assurance_goals",
						"model_dependency",
						"ratings",
					]}
				>
					{/* Assurance Goals Filter */}
					<AccordionItem value="assurance_goals">
						<AccordionTrigger className="px-4">
							Assurance Goals
						</AccordionTrigger>
						<AccordionContent className="px-4">
							{isDataLoading ? (
								<div className="text-sm text-muted-foreground py-2">
									Loading...
								</div>
							) : (
								<div className="space-y-3">
									{assuranceGoals?.map((goal) => (
										<div
											key={goal.id}
											className="flex items-start space-x-2"
										>
											<Checkbox
												id={`goal-${goal.id}`}
												checked={filters.assurance_goals.includes(
													goal.id.toString()
												)}
												onCheckedChange={() =>
													toggleArrayFilter(
														"assurance_goals",
														goal.id.toString()
													)
												}
											/>
											<Label
												htmlFor={`goal-${goal.id}`}
												className="flex items-center gap-2 cursor-pointer text-sm font-normal"
											>
												<GoalIcon
													goalName={goal.name}
													size={16}
												/>
												<span>{goal.name}</span>
											</Label>
										</div>
									))}
								</div>
							)}
						</AccordionContent>
					</AccordionItem>

					{/* Categories Filter */}
					<AccordionItem value="categories">
						<AccordionTrigger className="px-4">
							Categories
						</AccordionTrigger>
						<AccordionContent className="px-4">
							{isDataLoading ? (
								<div className="text-sm text-muted-foreground py-2">
									Loading...
								</div>
							) : (
								<div className="space-y-3">
									{categories?.map((category) => (
										<div
											key={category.id}
											className="flex items-start space-x-2"
										>
											<Checkbox
												id={`category-${category.id}`}
												checked={filters.categories.includes(
													category.id.toString()
												)}
												onCheckedChange={() =>
													toggleArrayFilter(
														"categories",
														category.id.toString()
													)
												}
											/>
											<Label
												htmlFor={`category-${category.id}`}
												className="cursor-pointer text-sm font-normal"
											>
												<CategoryTag
													name={category.name}
												/>
											</Label>
										</div>
									))}
								</div>
							)}
						</AccordionContent>
					</AccordionItem>

					{/* Model Dependency Filter */}
					<AccordionItem value="model_dependency">
						<AccordionTrigger className="px-4">
							Model Dependency
						</AccordionTrigger>
						<AccordionContent className="px-4">
							<div className="space-y-3">
								{["Model-Agnostic", "Model-Specific"].map(
									(dependency) => (
										<div
											key={dependency}
											className="flex items-start space-x-2"
										>
											<Checkbox
												id={`dependency-${dependency}`}
												checked={filters.model_dependency.includes(
													dependency
												)}
												onCheckedChange={() =>
													toggleArrayFilter(
														"model_dependency",
														dependency
													)
												}
											/>
											<Label
												htmlFor={`dependency-${dependency}`}
												className="cursor-pointer text-sm font-normal"
											>
												{dependency}
											</Label>
										</div>
									)
								)}
							</div>
						</AccordionContent>
					</AccordionItem>

					{/* Ratings Filter */}
					<AccordionItem value="ratings">
						<AccordionTrigger className="px-4">
							Ratings
						</AccordionTrigger>
						<AccordionContent className="px-4">
							<div className="space-y-6">
								{/* Complexity Rating */}
								<div className="space-y-3">
									<h4 className="text-sm font-medium">
										Complexity
									</h4>
									<div className="pt-2 pb-1">
										<Slider
											value={[
												filters.complexity_min || 1,
												filters.complexity_max || 5,
											]}
											min={1}
											max={5}
											step={1}
											onValueChange={(value) => {
												updateFilter(
													"complexity_min",
													value[0]
												);
												updateFilter(
													"complexity_max",
													value[1]
												);
											}}
										/>
									</div>
									<div className="flex justify-between text-xs text-muted-foreground">
										<span>
											{filters.complexity_min || 1}
										</span>
										<span>
											{filters.complexity_max || 5}
										</span>
									</div>
								</div>

								{/* Computational Cost Rating */}
								<h4 className="text-sm font-medium">
									Computational Cost
								</h4>
								<div className="pt-2 pb-1">
									<Slider
										value={[
											filters.computational_cost_min || 1,
											filters.computational_cost_max || 5,
										]}
										min={1}
										max={5}
										step={1}
										onValueChange={(value) => {
											updateFilter(
												"computational_cost_min",
												value[0]
											);
											updateFilter(
												"computational_cost_max",
												value[1]
											);
										}}
									/>
								</div>
								<div className="flex justify-between text-xs text-muted-foreground">
									<span>
										{filters.computational_cost_min || 1}
									</span>
									<span>
										{filters.computational_cost_max || 5}
									</span>
								</div>
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>

			{/* Apply filters button (mobile only) */}
			<div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t md:hidden">
				<Button onClick={applyFilters} className="w-full">
					Apply Filters
				</Button>
			</div>
		</div>
	);
};

export default TechniquesSidebar;