// src/lib/types.ts

// Base type interfaces
export interface AssuranceGoal {
	id: number;
	name: string;
	description: string;
}


export interface Tag {
	id: number;
	name: string;
}


// Resource Management
export interface ResourceType {
	id: number;
	name: string;
	icon: string;
}

export interface TechniqueResource {
	id: number;
	resource_type: number;
	resource_type_name: string;
	source_type?: string;  // Added based on data in techniques.csv
	title: string;
	url: string;
	description: string;
	authors?: string;
	publication_date?: string;
}

// Use Cases and Limitations
export interface TechniqueExampleUseCase {
	id: number;
	description: string;
	assurance_goal?: number;
	assurance_goal_name?: string;
}

export interface TechniqueLimitation {
	id: number;
	description: string;
}


// Main Technique Type
export interface Technique {
	slug: string;
	name: string;
	acronym?: string;
	description: string;
	complexity_rating?: number;
	computational_cost_rating?: number;

	// Many-to-many relationships
	assurance_goals: AssuranceGoal[];
	tags: Tag[];
	related_techniques: string[]; // Now slugs instead of IDs

	// Related data
	resources: TechniqueResource[];
	example_use_cases: TechniqueExampleUseCase[];
	limitations: TechniqueLimitation[];
}

// Form Data for Creating/Updating Techniques
export interface TechniqueFormData {
	name: string;
	acronym?: string;
	description: string;
	complexity_rating?: number;
	computational_cost_rating?: number;
	assurance_goal_ids: number[];
	tag_ids: number[];
	related_technique_slugs: string[];
	resources: {
		resource_type: number;
		title: string;
		url: string;
		description: string;
		authors?: string;
		publication_date?: string;
		source_type?: string;
	}[];
	example_use_cases: {
		description: string;
		assurance_goal?: number;
	}[];
	limitations: string[];
}

// API Response wrapper type
export interface APIResponse<T> {
	count: number;
	next: string | null;
	previous: string | null;
	results: T[];
}

// Generic response type
export interface APIErrorResponse {
	detail?: string;
	errors?: Record<string, string[]>;
	status_code?: number;
	error_type?: string;
	[key: string]:
		| string
		| number
		| boolean
		| null
		| undefined
		| Record<string, string[]>;
}
