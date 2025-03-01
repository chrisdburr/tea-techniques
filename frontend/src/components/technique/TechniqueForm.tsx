// src/components/technique/TechniqueForm.tsx
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateTechnique, useUpdateTechnique } from "@/lib/api/hooks";
import { Technique } from "@/lib/types";

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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface TechniqueFormProps {
	technique?: Technique;
	isEditMode?: boolean;
}

const TechniqueForm: React.FC<TechniqueFormProps> = ({
	technique,
	isEditMode = false,
}) => {
	const router = useRouter();
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		model_dependency: "Model-Agnostic", // Default value
		example_use_case: "",
		limitation: "",
		reference: "",
		software_package: "",
	});

	const [errors, setErrors] = useState<{ [key: string]: string }>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Set up mutations
	const createMutation = useCreateTechnique();
	const updateMutation = useUpdateTechnique(technique?.id || 0);
	const isLoading =
		createMutation.isPending || updateMutation.isPending || isSubmitting;

	// Initialize form data when editing an existing technique
	useEffect(() => {
		if (isEditMode && technique) {
			setFormData({
				name: technique.name || "",
				description: technique.description || "",
				model_dependency:
					technique.model_dependency || "Model-Agnostic",
				example_use_case: technique.example_use_case || "",
				limitation: technique.limitation || "",
				reference: technique.reference || "",
				software_package: technique.software_package || "",
			});
		}
	}, [isEditMode, technique]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));

		// Clear error for this field when it's changed
		if (errors[name]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[name];
				return newErrors;
			});
		}
	};

	const handleSelectChange = (name: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const validateForm = () => {
		const newErrors: { [key: string]: string } = {};

		if (!formData.name.trim()) {
			newErrors.name = "Name is required";
		}

		if (!formData.description.trim()) {
			newErrors.description = "Description is required";
		}

		if (!formData.model_dependency) {
			newErrors.model_dependency = "Model dependency is required";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);

		try {
			if (isEditMode && technique) {
				// Update existing technique
				await updateMutation.mutateAsync({
					id: technique.id,
					...formData,
				});
				router.push(`/techniques/${technique.id}`);
			} else {
				// Create new technique
				const result = await createMutation.mutateAsync(formData);
				router.push(`/techniques/${result.id}`);
			}
		} catch (error) {
			console.error("Error submitting form:", error);
			setErrors({
				submit:
					error instanceof Error
						? error.message
						: "An unknown error occurred",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<form onSubmit={handleSubmit}>
				<CardHeader>
					<CardTitle>
						{isEditMode ? "Edit Technique" : "Add New Technique"}
					</CardTitle>
					<CardDescription>
						{isEditMode
							? "Update the details of this technique"
							: "Create a new technique to add to the database"}
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-6">
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name" className="text-base">
								Technique Name{" "}
								<span className="text-red-500">*</span>
							</Label>
							<Input
								id="name"
								name="name"
								value={formData.name}
								onChange={handleChange}
								placeholder="Enter technique name"
								className={errors.name ? "border-red-500" : ""}
							/>
							{errors.name && (
								<p className="text-sm text-red-500">
									{errors.name}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="description" className="text-base">
								Description{" "}
								<span className="text-red-500">*</span>
							</Label>
							<Textarea
								id="description"
								name="description"
								value={formData.description}
								onChange={handleChange}
								placeholder="Enter a detailed description"
								rows={4}
								className={
									errors.description ? "border-red-500" : ""
								}
							/>
							{errors.description && (
								<p className="text-sm text-red-500">
									{errors.description}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="model_dependency"
								className="text-base"
							>
								Model Dependency{" "}
								<span className="text-red-500">*</span>
							</Label>
							<Select
								value={formData.model_dependency}
								onValueChange={(value) =>
									handleSelectChange(
										"model_dependency",
										value
									)
								}
							>
								<SelectTrigger
									id="model_dependency"
									className={
										errors.model_dependency
											? "border-red-500"
											: ""
									}
								>
									<SelectValue placeholder="Select dependency type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Model-Agnostic">
										Model-Agnostic
									</SelectItem>
									<SelectItem value="Model-Specific">
										Model-Specific
									</SelectItem>
								</SelectContent>
							</Select>
							{errors.model_dependency && (
								<p className="text-sm text-red-500">
									{errors.model_dependency}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="example_use_case"
								className="text-base"
							>
								Example Use Case
							</Label>
							<Textarea
								id="example_use_case"
								name="example_use_case"
								value={formData.example_use_case}
								onChange={handleChange}
								placeholder="Describe an example use case"
								rows={3}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="limitation" className="text-base">
								Limitations
							</Label>
							<Textarea
								id="limitation"
								name="limitation"
								value={formData.limitation}
								onChange={handleChange}
								placeholder="Describe any limitations"
								rows={3}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="reference" className="text-base">
								Reference URL
							</Label>
							<Input
								id="reference"
								name="reference"
								type="url"
								value={formData.reference}
								onChange={handleChange}
								placeholder="https://example.com/reference"
							/>
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="software_package"
								className="text-base"
							>
								Software Package URL
							</Label>
							<Input
								id="software_package"
								name="software_package"
								type="url"
								value={formData.software_package}
								onChange={handleChange}
								placeholder="https://example.com/package"
							/>
						</div>
					</div>

					{errors.submit && (
						<div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
							{errors.submit}
						</div>
					)}
				</CardContent>

				<CardFooter className="flex justify-between">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.back()}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isLoading}>
						{isLoading ? (
							<span className="flex items-center gap-2">
								<span className="animate-spin">↻</span>
								{isEditMode ? "Updating..." : "Submitting..."}
							</span>
						) : (
							<>
								{isEditMode
									? "Update Technique"
									: "Create Technique"}
							</>
						)}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
};

export default TechniqueForm;
