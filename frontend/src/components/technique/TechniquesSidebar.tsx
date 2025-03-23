"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ArrowRightFromLine, ChevronLeft, Search } from "lucide-react";
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

// Export this interface so it can be imported by TechniquesList.tsx
export interface FilterState {
	search: string;
	assurance_goals: string[];
	categories: string[];
	model_dependency: string[];
	complexity_max?: number;
	computational_cost_max?: number;
}

interface TechniquesSidebarProps {
	// Filter state
	filters: FilterState;
	setFilters: (filters: FilterState) => void;
	applyFilters: (filters?: FilterState) => void; // Updated to accept optional filters
	resetFilters: () => void;

	// Data for populating filters
	assuranceGoals?: AssuranceGoal[];
	categories?: Category[];
	isDataLoading: boolean;

	// Mobile state
	isMobileOpen: boolean;
	setIsMobileOpen: (isOpen: boolean) => void;

	// New prop to control showing toggle in header
	allowToggle?: boolean;
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
	allowToggle = false,
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
		console.log(`UpdateFilter called for ${key} with value:`, value);
		// Only update state, don't apply filters
		setFilters({ ...filters, [key]: value });
		console.log("Filter state updated, waiting for Apply button");
	};

	// Helper to toggle an item in an array filter without immediately applying
	const toggleArrayFilter = (key: keyof FilterState, itemId: string) => {
		console.log(`Toggling ${key} filter with value: ${itemId}`);
		const currentValues = filters[key] as string[];

		const newValues = currentValues.includes(itemId)
			? currentValues.filter((id) => id !== itemId)
			: [...currentValues, itemId];

		// Update filter state without applying immediately
		updateFilter(key, newValues as FilterState[typeof key]);
		console.log(`${key} filter updated, but not applied - waiting for Apply button`);
	};

	return (
		<div className={`bg-background border overflow-hidden ${isMobileOpen ? 'md:relative md:rounded-lg md:shadow-sm fixed inset-0 z-50' : 'rounded-lg shadow-sm'}`}>
			{/* Mobile filter panel content wrapper */}
			<div className={`${isMobileOpen ? 'h-full flex flex-col md:block' : ''}`}>
			{/* Overlay to capture clicks outside the sidebar on mobile */}
			{isMobileOpen && (
				<div
					className="fixed inset-0 bg-black/30 md:hidden"
					style={{ zIndex: -1 }}
					onClick={toggleSidebar}
					aria-hidden="true"
				/>
			)}
			{/* Sidebar header */}
			<div className="p-4 border-b flex items-center justify-between sticky top-0 bg-background z-10">
				<h2 className="font-semibold text-lg">Filters</h2>
				<div className="flex gap-2">
					{/* Toggle button for desktop */}
					{allowToggle && (
						<Button
							variant="outline"
							size="sm"
							onClick={toggleSidebar}
							className="hidden md:flex items-center"
							aria-label="Hide filters"
						>
							<ChevronLeft className="h-4 w-4 mr-2" />
							Hide
						</Button>
					)}

					{/* Close button for mobile only */}
					<Button
						variant="outline"
						size="sm"
						onClick={toggleSidebar}
						className="md:hidden"
						aria-label="Close filters"
					>
						<ArrowRightFromLine className="h-4 w-4" />
					</Button>
				</div>
			</div>
			{/* Filters */}
			<div className="overflow-y-auto py-2 bg-background flex-1 md:h-auto md:max-h-[calc(100vh-170px)]">
				<div className="p-4">
					<div className="relative">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search techniques..."
							value={filters.search}
							onChange={(e) => {
								updateFilter("search", e.target.value);
							}}
							className="w-full pl-8"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									applyFilters(filters);
								}
							}}
						/>
					</div>
					
					{/* Action buttons for both mobile and desktop - shown at top on desktop, hidden on mobile */}
					<div className="hidden md:flex flex-row gap-2 mt-4">
						<Button
							onClick={() => applyFilters(filters)}
							variant="default"
							className="flex-1 font-medium"
							size="default"
						>
							Apply Filters
						</Button>
						<Button
							onClick={resetFilters}
							variant="outline"
							className="flex-1"
							size="sm"
						>
							Reset
						</Button>
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
								{/* Complexity Rating - With visible steps */}
								<div className="space-y-3">
									<h4 className="text-sm font-medium">
										Maximum Complexity
									</h4>
									<div className="pt-2 pb-1">
										<Slider
											value={[
												filters.complexity_max || 5,
											]}
											min={1}
											max={5}
											step={1}
											onValueChange={(value) => {
												console.log(`Changing complexity_max to: ${value[0]}`);
												updateFilter(
													"complexity_max",
													value[0]
												);
												console.log("Complexity updated, but not applied - waiting for Apply button");
											}}
										/>
									</div>
									<div className="flex justify-between text-xs text-muted-foreground">
										<span>1</span>
										<span>2</span>
										<span>3</span>
										<span>4</span>
										<span>5</span>
									</div>
									<div className="flex justify-between text-xs text-muted-foreground">
										<span>Simple</span>
										<span className="ml-auto">Complex</span>
									</div>
								</div>

								{/* Computational Cost Rating - With visible steps */}
								<div className="space-y-3">
									<h4 className="text-sm font-medium">
										Maximum Computational Cost
									</h4>
									<div className="pt-2 pb-1">
										<Slider
											value={[
												filters.computational_cost_max ||
													5,
											]}
											min={1}
											max={5}
											step={1}
											onValueChange={(value) => {
												console.log(`Changing computational_cost_max to: ${value[0]}`);
												updateFilter(
													"computational_cost_max",
													value[0]
												);
												console.log("Computational cost updated, but not applied - waiting for Apply button");
											}}
										/>
									</div>
									<div className="flex justify-between text-xs text-muted-foreground">
										<span>1</span>
										<span>2</span>
										<span>3</span>
										<span>4</span>
										<span>5</span>
									</div>
									<div className="flex justify-between text-xs text-muted-foreground">
										<span>Low</span>
										<span className="ml-auto">High</span>
									</div>
								</div>
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>

			{/* Mobile-only action buttons at the bottom */}
			<div className="sticky bottom-0 p-4 bg-background border-t shadow-md z-10 md:hidden">
				<div className="flex flex-col gap-2">
					<Button
						onClick={() => applyFilters(filters)}
						variant="default"
						className="w-full font-medium"
						size="default"
					>
						Apply Filters
					</Button>
					<Button
						onClick={resetFilters}
						variant="outline"
						className="w-full"
						size="sm"
					>
						Reset Filters
					</Button>
				</div>
			</div>
			</div>
		</div>
	);
};

export default TechniquesSidebar;