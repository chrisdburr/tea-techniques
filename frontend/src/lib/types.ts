// src/lib/types.ts - Update or replace with these type definitions

// Base type interfaces
export interface AssuranceGoal {
	id: number;
	name: string;
	description: string;
}

export interface Category {
	id: number;
	name: string;
	description: string;
	assurance_goal: number;
	assurance_goal_name: string;
}

export interface SubCategory {
	id: number;
	name: string;
	description: string;
	category: number;
	category_name: string;
}

export interface Tag {
	id: number;
	name: string;
}

// Attribute System
export interface AttributeType {
	id: number;
	name: string;
	description: string;
	applicable_goals: number[];
	required_for_goals: number[];
}

export interface AttributeValue {
	id: number;
	attribute_type: number;
	attribute_type_name: string;
	name: string;
	description: string;
}

export interface TechniqueAttribute {
	id: number;
	attribute_type: string;
	attribute_value: number;
	attribute_value_name: string;
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
	title: string;
	url: string;
	description: string;
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

// Technique Relationship
export interface TechniqueRelationship {
	id: number;
	technique_from: number;
	technique_from_name: string;
	technique_to: number;
	technique_to_name: string;
	relationship_type: string;
}

// Main Technique Type
export interface Technique {
	id: number;
	name: string;
	description: string;
	model_dependency: string;

	// Many-to-many relationships
	assurance_goals: AssuranceGoal[];
	categories: Category[];
	subcategories: SubCategory[];
	tags: Tag[];

	// New relationship data
	attributes: TechniqueAttribute[];
	resources: TechniqueResource[];
	example_use_cases: TechniqueExampleUseCase[];
	limitations: TechniqueLimitation[];
}

// Form Data for Creating/Updating Techniques
export interface TechniqueFormData {
	name: string;
	description: string;
	model_dependency: string;
	assurance_goal_ids: number[];
	category_ids: number[];
	subcategory_ids: number[];
	tag_ids: number[];
	attributes: {
		attribute_type: number;
		attribute_value: number;
	}[];
	resources: {
		resource_type: number;
		title: string;
		url: string;
		description: string;
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
	[key: string]: string | number | boolean | null | undefined | Record<string, string[]>;
}
