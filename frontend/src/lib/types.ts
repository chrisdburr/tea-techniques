export interface Technique {
	id: number;
	name: string;
	description: string;
	category_name: string;
	model_dependency: string;
	assurance_goal_name?: string;
	sub_category_name?: string;
	scope?: string;
	example_use_case: string;
	limitation?: string;
	reference?: string;
	software_package?: string;
	tags: Tag[];
}

export interface Tag {
	id: number;
	name: string;
}

export interface Category {
	id: number;
	name: string;
	description: string;
	assurance_goal: number;
	assurance_goal_name: string;
}

export interface AssuranceGoal {
	id: number;
	name: string;
	description: string;
}

export interface APIResponse<T> {
	count: number;
	next: string | null;
	previous: string | null;
	results: T[];
}
