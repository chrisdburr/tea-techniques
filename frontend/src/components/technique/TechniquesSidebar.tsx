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
	applyFilters: () => void;
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
		<div className="bg-background border rounded-lg shadow-sm overflow-hidden">
			{/* Overlay to capture clicks outside the sidebar on mobile */}
			{isMobileOpen && (
				<div 
					className="fixed inset-0 bg-black/30 z-[-1] md:hidden" 
					onClick={toggleSidebar}
					aria-hidden="true"
				/>
			)}
			
			{/* Sidebar header */}
			<div className="p-4 border-b flex items-center justify-between sticky top-0 bg-background z-10">
				<h2 className="font-semibold text-lg">Filters</h2>
				<div className="flex gap-2">
					<Button variant="outline" size="sm" onClick={resetFilters}>
						Reset
					</Button>
					
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
			<div className="overflow-y-auto max-h-[calc(100vh-120px)] py-2 bg-background">
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
					<div className="mt-2 md:hidden">
						<Button 
							onClick={applyFilters} 
							size="sm" 
							className="w-full"
							disabled={isDataLoading}
						>
							{isDataLoading ? 'Loading...' : 'Search'}
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
								{/* Complexity Rating - Single threshold */}
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
												updateFilter(
													"complexity_max",
													value[0]
												);
											}}
										/>
									</div>
									<div className="flex justify-between text-xs text-muted-foreground">
										<span>Simple (1)</span>
										<span>Complex (5)</span>
									</div>
								</div>

								{/* Computational Cost Rating - Single threshold */}
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
												updateFilter(
													"computational_cost_max",
													value[0]
												);
											}}
										/>
									</div>
									<div className="flex justify-between text-xs text-muted-foreground">
										<span>Low (1)</span>
										<span>
											Current:{" "}
											{filters.computational_cost_max ||
												5}
										</span>
										<span>High (5)</span>
									</div>
								</div>
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>

			{/* Apply filters button (mobile only) */}
			<div className="sticky bottom-0 left-0 right-0 p-4 bg-background border-t md:hidden">
				<div className="flex gap-2">
					<Button onClick={resetFilters} variant="outline" className="w-1/3">
						Reset
					</Button>
					<Button onClick={applyFilters} className="w-2/3">
						Apply Filters
					</Button>
				</div>
			</div>
		</div>
	);
};

export default TechniquesSidebar;