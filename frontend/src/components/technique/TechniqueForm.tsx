// frontend/src/components/technique/TechniqueForm.tsx
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAddTechnique } from "@/lib/api/useTechniques";

const TechniqueForm = () => {
	const router = useRouter();
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		model_dependency: "",
		example_use_case: "",
	});
	const [errors, setErrors] = useState<{ [key: string]: string }>({});

	// Use the mutation hook and derive isLoading from status
	const { mutate, status } = useAddTechnique();
	const isLoading = status === "pending";

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

		mutate(formData, {
			onSuccess: () => {
				// Redirect to the techniques listing page after successful submission
				router.push("/techniques");
			},
			onError: (err: Error) => {
				setErrors({ submit: err.message || "An error occurred" });
			},
		});
	};

	return (
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
					className="border p-2 rounded"
				/>
				{errors.name && (
					<p className="text-red-500 text-sm mt-1">{errors.name}</p>
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
				<Label htmlFor="model_dependency">Model Dependency</Label>
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
				<Label htmlFor="example_use_case">Example Use Case</Label>
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
				<p className="text-red-500 text-sm mb-4">{errors.submit}</p>
			)}
			<Button type="submit" disabled={isLoading}>
				{isLoading ? "Submitting..." : "Submit"}
			</Button>
		</form>
	);
};

export default TechniqueForm;
