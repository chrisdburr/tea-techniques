"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import {
	useTechniques,
	useCategories,
	useAssuranceGoals,
} from "@/lib/api/hooks";
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
import Link from "next/link";
import { Technique, Category, AssuranceGoal } from "@/lib/types";

// Loading component
function LoadingState() {
	return (
		<div className="flex justify-center items-center min-h-[400px]">
			<p className="text-lg text-muted-foreground">
				Loading techniques...
			</p>
		</div>
	);
}

// Types for the search form
interface SearchFilters {
	search: string;
	assuranceGoal: string;
	category: string;
}

interface SearchFormProps {
	onSearch: (filters: SearchFilters) => void;
	onReset: () => void;
}

// Search and filter form component
function SearchForm({ onSearch, onReset }: SearchFormProps) {
	const [search, setSearch] = useState("");
	const { data: categoriesData } = useCategories();
	const { data: assuranceGoalsData } = useAssuranceGoals();
	const [assuranceGoal, setAssuranceGoal] = useState("all");
	const [category, setCategory] = useState("all");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSearch({ search, assuranceGoal, category });
	};

	return (
		<form onSubmit={handleSubmit} className="bg-muted/30 p-4 rounded-lg">
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Input
					placeholder="Search techniques..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				<Select value={assuranceGoal} onValueChange={setAssuranceGoal}>
					<SelectTrigger>
						<SelectValue placeholder="Assurance Goal" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Assurance Goals</SelectItem>
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
				<Select value={category} onValueChange={setCategory}>
					<SelectTrigger>
						<SelectValue placeholder="Category" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Categories</SelectItem>
						{categoriesData?.results?.map((cat: Category) => (
							<SelectItem key={cat.id} value={cat.id.toString()}>
								{cat.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<div className="flex gap-2">
					<Button type="submit">Apply Filters</Button>
					<Button type="button" variant="outline" onClick={onReset}>
						Reset
					</Button>
				</div>
			</div>
		</form>
	);
}

// Main content component that uses searchParams
function TechniqueContent() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const search = searchParams.get("search") || "";
	const assuranceGoal = searchParams.get("assurance_goal") || "all";
	const category = searchParams.get("category") || "all";

	const { data: techniquesData, isLoading } = useTechniques({
		search,
		assurance_goal: assuranceGoal,
		category,
	});

	const handleSearch = (filters: SearchFilters) => {
		const params = new URLSearchParams();
		if (filters.search) params.set("search", filters.search);
		if (filters.assuranceGoal !== "all")
			params.set("assurance_goal", filters.assuranceGoal);
		if (filters.category !== "all")
			params.set("category", filters.category);
		router.push(`/techniques?${params.toString()}`);
	};

	const handleReset = () => {
		router.push("/techniques");
	};

	if (isLoading) return <LoadingState />;

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Techniques</h1>
				<Button asChild>
					<Link href="/techniques/add">Add New Technique</Link>
				</Button>
			</div>

			<SearchForm onSearch={handleSearch} onReset={handleReset} />

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{techniquesData?.results?.map((technique: Technique) => (
					<Card key={technique.id}>
						<CardHeader>
							<CardTitle>{technique.name}</CardTitle>
							<CardDescription>
								{technique.category_name} |{" "}
								{technique.model_dependency}
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
				))}
			</div>

			{techniquesData?.results?.length === 0 && (
				<div className="text-center py-8">
					<p>No techniques found matching your criteria.</p>
				</div>
			)}
		</div>
	);
}

// Main page component with Suspense boundary
export default function TechniquesPage() {
	return (
		<MainLayout>
			<Suspense fallback={<LoadingState />}>
				<TechniqueContent />
			</Suspense>
		</MainLayout>
	);
}
