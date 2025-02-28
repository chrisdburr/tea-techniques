"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { useTechniqueDetail, useUpdateTechnique } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function EditTechniquePage() {
	const params = useParams();
	const router = useRouter();
	const id = Number(params.id);

	// Fetch current technique details
	const { data: technique, isLoading, error } = useTechniqueDetail(id);
	// Mutation hook to update the technique
	const updateMutation = useUpdateTechnique(id);

	// Local state to hold form values
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		model_dependency: "",
		example_use_case: "",
	});
	const [errors, setErrors] = useState<{ [key: string]: string }>({});

	// When the technique data loads, pre-populate the form
	useEffect(() => {
		if (technique) {
			setFormData({
				name: technique.name,
				description: technique.description,
				model_dependency: technique.model_dependency,
				example_use_case: technique.example_use_case,
			});
		}
	}, [technique]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Basic client-side validation
		if (!formData.name) {
			setErrors({ name: "Name is required" });
			return;
		}
		setErrors({});

		// Call updateMutation with the technique ID and updated form data
		updateMutation.mutate(
			{ id, ...formData },
			{
				onSuccess: () => {
					// Redirect to the detail page after successful update
					router.push(`/techniques/${id}`);
				},
				onError: (err: Error) => {
					setErrors({ submit: err.message || "An error occurred" });
				},
			}
		);
	};

	if (isLoading) {
		return (
			<MainLayout>
				<div className="flex justify-center items-center py-20">
					<p>Loading technique data...</p>
				</div>
			</MainLayout>
		);
	}

	if (error) {
		return (
			<MainLayout>
				<div className="flex justify-center items-center py-20">
					<p>Error loading technique data.</p>
				</div>
			</MainLayout>
		);
	}

	return (
		<MainLayout>
			<div className="container mx-auto p-4">
				<h1 className="text-2xl font-bold mb-4">Edit Technique</h1>
				<form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4">
					<div className="mb-4">
						<Label htmlFor="name">Technique Name</Label>
						<Input
							id="name"
							name="name"
							type="text"
							value={formData.name}
							onChange={handleChange}
							placeholder="Enter technique name"
						/>
						{errors.name && (
							<p className="text-red-500 text-sm mt-1">
								{errors.name}
							</p>
						)}
					</div>
					<div className="mb-4">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							name="description"
							value={formData.description}
							onChange={handleChange}
							placeholder="Enter description"
							rows={4}
						/>
					</div>
					<div className="mb-4">
						<Label htmlFor="model_dependency">
							Model Dependency
						</Label>
						<Input
							id="model_dependency"
							name="model_dependency"
							type="text"
							value={formData.model_dependency}
							onChange={handleChange}
							placeholder="Enter model dependency (Agnostic/Specific)"
						/>
					</div>
					<div className="mb-4">
						<Label htmlFor="example_use_case">
							Example Use Case
						</Label>
						<Textarea
							id="example_use_case"
							name="example_use_case"
							value={formData.example_use_case}
							onChange={handleChange}
							placeholder="Describe an example use case"
							rows={4}
						/>
					</div>
					{errors.submit && (
						<p className="text-red-500 text-sm mb-4">
							{errors.submit}
						</p>
					)}
					<Button
						type="submit"
						disabled={updateMutation.status === "pending"}
					>
						{updateMutation.status === "pending"
							? "Saving..."
							: "Save Changes"}
					</Button>
				</form>
			</div>
		</MainLayout>
	);
}
