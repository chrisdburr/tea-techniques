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
	title: string;
	url: string;
	source_type: string;
	authors?: string[];
	publication_date?: string;
}

// Use Cases and Limitations - Simplified for static data
export interface TechniqueExampleUseCase {
	description: string;
	goal: string; // Changed from assurance_goal number to goal string to match JSON schema
}

export interface TechniqueLimitation {
	description: string;
}


// Main Technique Type - Updated for static data with slug-based identifiers
export interface Technique {
	slug: string;
	name: string;
	description: string;
	complexity_rating?: number;
	computational_cost_rating?: number;
	acronym?: string;

	// Simple arrays for static data
	assurance_goals: string[];
	tags: string[];
	related_techniques: string[];

	// Related data
	resources: TechniqueResource[];
	example_use_cases: TechniqueExampleUseCase[];
	limitations: TechniqueLimitation[];
}

// Form Data for Creating/Updating Techniques
export interface TechniqueFormData {
	name: string;
	description: string;
	complexity_rating?: number;
	computational_cost_rating?: number;
	assurance_goal_ids: number[];
	tag_ids: number[];
	related_technique_ids: number[];
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
