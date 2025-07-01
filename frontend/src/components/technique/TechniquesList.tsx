// TechniquesList.tsx - Static version for GitHub Pages
"use client";

import React, { useState, useMemo } from "react";
import { getTechniques, getAssuranceGoals, getTags } from "@/lib/data/static-data";
import TechniqueCard from "@/components/technique/TechniqueCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
	Search, 
	Filter, 
	X, 
	ChevronDown, 
	ChevronUp,
	Loader2 
} from "lucide-react";
import type { Technique } from "@/lib/types";

// Client-side filtering function
function filterTechniques(
	techniques: Technique[],
	searchTerm: string,
	selectedGoals: string[],
	selectedTags: string[],
	complexityMax: number,
	costMax: number
): Technique[] {
	return techniques.filter(technique => {
		// Search filter
		if (searchTerm) {
			const searchLower = searchTerm.toLowerCase();
			const matchesSearch = 
				technique.name.toLowerCase().includes(searchLower) ||
				technique.description.toLowerCase().includes(searchLower) ||
				(technique.acronym && technique.acronym.toLowerCase().includes(searchLower));
			
			if (!matchesSearch) return false;
		}
		
		// Assurance goals filter
		if (selectedGoals.length > 0) {
			const hasMatchingGoal = selectedGoals.some(goal => 
				technique.assurance_goals.includes(goal)
			);
			if (!hasMatchingGoal) return false;
		}
		
		// Tags filter
		if (selectedTags.length > 0) {
			const hasMatchingTag = selectedTags.some(tag => 
				technique.tags.includes(tag)
			);
			if (!hasMatchingTag) return false;
		}
		
		// Complexity filter
		if (technique.complexity_rating && technique.complexity_rating > complexityMax) {
			return false;
		}
		
		// Computational cost filter
		if (technique.computational_cost_rating && technique.computational_cost_rating > costMax) {
			return false;
		}
		
		return true;
	});
}

// Simple pagination
function paginateResults<T>(items: T[], page: number, pageSize: number = 20): {
	items: T[];
	totalPages: number;
	currentPage: number;
} {
	const totalPages = Math.ceil(items.length / pageSize);
	const startIndex = (page - 1) * pageSize;
	const endIndex = startIndex + pageSize;
	
	return {
		items: items.slice(startIndex, endIndex),
		totalPages,
		currentPage: page,
	};
}

interface TechniquesListProps {
	initialTechniques?: Technique[];
	initialGoals?: string[];
	initialTags?: string[];
}

export default function TechniquesList({ 
	initialTechniques, 
	initialGoals, 
	initialTags 
}: TechniquesListProps) {
	// State for data (will be populated from props or loaded)
	const [techniques, setTechniques] = useState<Technique[]>(initialTechniques || []);
	const [assuranceGoals, setAssuranceGoals] = useState<string[]>(initialGoals || []);
	const [tags, setTags] = useState<string[]>(initialTags || []);
	const [isLoading, setIsLoading] = useState(!initialTechniques);
	
	// Filter state
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [complexityMax, setComplexityMax] = useState(5);
	const [costMax, setCostMax] = useState(5);
	const [currentPage, setCurrentPage] = useState(1);
	
	// UI state
	const [showFilters, setShowFilters] = useState(false);
	const [showGoals, setShowGoals] = useState(false);
	const [showTags, setShowTags] = useState(false);
	
	// Load data if not provided as props
	React.useEffect(() => {
		if (!initialTechniques) {
			const loadData = async () => {
				try {
					const [techniquesData, goalsData, tagsData] = await Promise.all([
						getTechniques(),
						getAssuranceGoals(),
						getTags()
					]);
					setTechniques(techniquesData);
					setAssuranceGoals(goalsData);
					setTags(tagsData);
				} catch (error) {
					console.error('Failed to load data:', error);
				} finally {
					setIsLoading(false);
				}
			};
			loadData();
		}
	}, [initialTechniques]);
	
	// Apply filters and pagination
	const { filteredTechniques, paginatedTechniques } = useMemo(() => {
		const filtered = filterTechniques(
			techniques,
			searchTerm,
			selectedGoals,
			selectedTags,
			complexityMax,
			costMax
		);
		
		// Reset to page 1 if current page would be empty
		const paginated = paginateResults(filtered, currentPage);
		if (paginated.items.length === 0 && currentPage > 1) {
			setCurrentPage(1);
			const newPaginated = paginateResults(filtered, 1);
			return {
				filteredTechniques: filtered,
				paginatedTechniques: newPaginated
			};
		}
		
		return {
			filteredTechniques: filtered,
			paginatedTechniques: paginated
		};
	}, [techniques, searchTerm, selectedGoals, selectedTags, complexityMax, costMax, currentPage]);
	
	// Reset filters
	const resetFilters = () => {
		setSearchTerm("");
		setSelectedGoals([]);
		setSelectedTags([]);
		setComplexityMax(5);
		setCostMax(5);
		setCurrentPage(1);
	};
	
	// Filter handlers
	const toggleGoal = (goal: string) => {
		setSelectedGoals(prev => 
			prev.includes(goal) 
				? prev.filter(g => g !== goal)
				: [...prev, goal]
		);
		setCurrentPage(1);
	};
	
	const toggleTag = (tag: string) => {
		setSelectedTags(prev => 
			prev.includes(tag) 
				? prev.filter(t => t !== tag)
				: [...prev, tag]
		);
		setCurrentPage(1);
	};
	
	if (isLoading) {
		return (
			<div className="flex justify-center items-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
				<span className="ml-2">Loading techniques...</span>
			</div>
		);
	}
	
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<h1 className="text-2xl sm:text-3xl font-bold">
					Techniques ({filteredTechniques.length} of {techniques.length})
				</h1>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowFilters(!showFilters)}
						className="flex items-center gap-2"
					>
						<Filter className="h-4 w-4" />
						Filters
					</Button>
				</div>
			</div>
			
			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search techniques..."
					value={searchTerm}
					onChange={(e) => {
						setSearchTerm(e.target.value);
						setCurrentPage(1);
					}}
					className="pl-10"
				/>
			</div>
			
			{/* Active filters */}
			{(selectedGoals.length > 0 || selectedTags.length > 0 || complexityMax < 5 || costMax < 5) && (
				<div className="flex flex-wrap gap-2 items-center">
					<span className="text-sm text-muted-foreground">Active filters:</span>
					{selectedGoals.map(goal => (
						<Badge key={goal} variant="secondary" className="gap-1">
							{goal}
							<X 
								className="h-3 w-3 cursor-pointer" 
								onClick={() => toggleGoal(goal)} 
							/>
						</Badge>
					))}
					{selectedTags.slice(0, 3).map(tag => (
						<Badge key={tag} variant="outline" className="gap-1">
							{tag.split('/').pop()}
							<X 
								className="h-3 w-3 cursor-pointer" 
								onClick={() => toggleTag(tag)} 
							/>
						</Badge>
					))}
					{selectedTags.length > 3 && (
						<Badge variant="outline">
							+{selectedTags.length - 3} more tags
						</Badge>
					)}
					{complexityMax < 5 && (
						<Badge variant="outline" className="gap-1">
							Complexity ≤ {complexityMax}
							<X 
								className="h-3 w-3 cursor-pointer" 
								onClick={() => setComplexityMax(5)} 
							/>
						</Badge>
					)}
					{costMax < 5 && (
						<Badge variant="outline" className="gap-1">
							Cost ≤ {costMax}
							<X 
								className="h-3 w-3 cursor-pointer" 
								onClick={() => setCostMax(5)} 
							/>
						</Badge>
					)}
					<Button variant="ghost" size="sm" onClick={resetFilters}>
						Clear all
					</Button>
				</div>
			)}
			
			{/* Filters panel */}
			{showFilters && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Filters</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Assurance Goals */}
						<div>
							<Button
								variant="ghost"
								onClick={() => setShowGoals(!showGoals)}
								className="w-full justify-between p-0 h-auto"
							>
								<span className="font-medium">Assurance Goals ({selectedGoals.length})</span>
								{showGoals ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
							</Button>
							{showGoals && (
								<div className="mt-2 grid grid-cols-2 gap-2">
									{assuranceGoals.map(goal => (
										<Button
											key={goal}
											variant={selectedGoals.includes(goal) ? "default" : "outline"}
											size="sm"
											onClick={() => toggleGoal(goal)}
											className="justify-start"
										>
											{goal}
										</Button>
									))}
								</div>
							)}
						</div>
						
						{/* Tags (show first 20) */}
						<div>
							<Button
								variant="ghost"
								onClick={() => setShowTags(!showTags)}
								className="w-full justify-between p-0 h-auto"
							>
								<span className="font-medium">Tags ({selectedTags.length})</span>
								{showTags ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
							</Button>
							{showTags && (
								<div className="mt-2 grid grid-cols-1 gap-1 max-h-60 overflow-y-auto">
									{tags.slice(0, 50).map(tag => (
										<Button
											key={tag}
											variant={selectedTags.includes(tag) ? "default" : "ghost"}
											size="sm"
											onClick={() => toggleTag(tag)}
											className="justify-start text-xs h-8"
										>
											{tag.split('/').pop()}
										</Button>
									))}
								</div>
							)}
						</div>
						
						{/* Complexity & Cost */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="text-sm font-medium">Max Complexity: {complexityMax}</label>
								<input
									type="range"
									min="1"
									max="5"
									value={complexityMax}
									onChange={(e) => {
										setComplexityMax(Number(e.target.value));
										setCurrentPage(1);
									}}
									className="w-full"
								/>
							</div>
							<div>
								<label className="text-sm font-medium">Max Cost: {costMax}</label>
								<input
									type="range"
									min="1"
									max="5"
									value={costMax}
									onChange={(e) => {
										setCostMax(Number(e.target.value));
										setCurrentPage(1);
									}}
									className="w-full"
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
			
			{/* Techniques grid */}
			{paginatedTechniques.items.length > 0 ? (
				<>
					<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
						{paginatedTechniques.items.map((technique: Technique) => (
							<TechniqueCard
								key={technique.slug}
								technique={technique}
							/>
						))}
					</div>
					
					{/* Simple pagination */}
					{paginatedTechniques.totalPages > 1 && (
						<div className="flex justify-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
								disabled={currentPage <= 1}
							>
								Previous
							</Button>
							<span className="flex items-center px-4 text-sm">
								Page {currentPage} of {paginatedTechniques.totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage(Math.min(paginatedTechniques.totalPages, currentPage + 1))}
								disabled={currentPage >= paginatedTechniques.totalPages}
							>
								Next
							</Button>
						</div>
					)}
				</>
			) : (
				<div className="text-center py-12">
					<p className="text-lg text-muted-foreground mb-2">
						No techniques found
					</p>
					<p className="text-sm text-muted-foreground mb-4">
						Try adjusting your filters or search terms
					</p>
					<Button onClick={resetFilters} variant="outline">
						Clear filters
					</Button>
				</div>
			)}
		</div>
	);
}