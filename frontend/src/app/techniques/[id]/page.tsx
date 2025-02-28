"use client";

import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { useTechniqueDetail, useDeleteTechnique } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

export default function TechniqueDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = Number(params.id);

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const { data: technique, isLoading, error } = useTechniqueDetail(id);
	const deleteMutation = useDeleteTechnique();

	if (isLoading) {
		return (
			<MainLayout>
				<div className="flex justify-center items-center py-20">
					<p>Loading technique details...</p>
				</div>
			</MainLayout>
		);
	}

	if (error) {
		return (
			<MainLayout>
				<div className="flex flex-col items-center justify-center py-20">
					<h1 className="text-2xl font-bold mb-4">
						Error Loading Technique
					</h1>
					<p className="text-muted-foreground mb-8">
						There was an error loading this technique. It may not
						exist or you may not have permission to view it.
					</p>
					<Button asChild>
						<Link href="/techniques">Back to Techniques</Link>
					</Button>
				</div>
			</MainLayout>
		);
	}

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(id);
			setDeleteDialogOpen(false);
			router.push("/techniques");
		} catch (error) {
			console.error("Error deleting technique:", error);
		}
	};

	return (
		<MainLayout>
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-3xl font-bold">
							{technique?.name}
						</h1>
						<p className="text-muted-foreground">
							{technique?.category_name} |{" "}
							{technique?.model_dependency}
						</p>
					</div>
					<div className="flex gap-2">
						<Button asChild variant="outline">
							<Link href={`/techniques/${id}/edit`}>Edit</Link>
						</Button>
						<Dialog
							open={deleteDialogOpen}
							onOpenChange={setDeleteDialogOpen}
						>
							<DialogTrigger asChild>
								<Button variant="destructive">Delete</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Delete Technique</DialogTitle>
									<DialogDescription>
										Are you sure you want to delete "
										{technique?.name}"? This action cannot
										be undone.
									</DialogDescription>
								</DialogHeader>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() =>
											setDeleteDialogOpen(false)
										}
									>
										Cancel
									</Button>
									<Button
										variant="destructive"
										onClick={handleDelete}
										disabled={deleteMutation.isPending}
									>
										{deleteMutation.isPending
											? "Deleting..."
											: "Delete"}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Description</CardTitle>
							</CardHeader>
							<CardContent>
								<p>{technique?.description}</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Example Use Case</CardTitle>
							</CardHeader>
							<CardContent>
								<p>{technique?.example_use_case}</p>
							</CardContent>
						</Card>

						{technique?.limitation && (
							<Card>
								<CardHeader>
									<CardTitle>Limitations</CardTitle>
								</CardHeader>
								<CardContent>
									<p>{technique?.limitation}</p>
								</CardContent>
							</Card>
						)}
					</div>

					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Details</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<h3 className="text-sm font-medium">
										Assurance Goal
									</h3>
									<p className="text-sm text-muted-foreground">
										{technique?.assurance_goal_name}
									</p>
								</div>

								<div>
									<h3 className="text-sm font-medium">
										Category
									</h3>
									<p className="text-sm text-muted-foreground">
										{technique?.category_name}
									</p>
								</div>

								{technique?.sub_category_name && (
									<div>
										<h3 className="text-sm font-medium">
											Sub-Category
										</h3>
										<p className="text-sm text-muted-foreground">
											{technique?.sub_category_name}
										</p>
									</div>
								)}

								<div>
									<h3 className="text-sm font-medium">
										Model Dependency
									</h3>
									<p className="text-sm text-muted-foreground">
										{technique?.model_dependency}
									</p>
								</div>

								{technique?.scope && (
									<div>
										<h3 className="text-sm font-medium">
											Scope
										</h3>
										<p className="text-sm text-muted-foreground">
											{technique?.scope}
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						{technique?.tags && technique.tags.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle>Tags</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex flex-wrap gap-2">
										{technique.tags.map((tag: any) => (
											<span
												key={tag.id}
												className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
											>
												{tag.name}
											</span>
										))}
									</div>
								</CardContent>
							</Card>
						)}

						{technique?.reference && (
							<Card>
								<CardHeader>
									<CardTitle>Resources</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2">
									{technique.reference && (
										<div>
											<h3 className="text-sm font-medium">
												Reference
											</h3>
											<a
												href={technique.reference}
												target="_blank"
												rel="noopener noreferrer"
												className="text-sm text-blue-600 hover:underline"
											>
												{technique.reference}
											</a>
										</div>
									)}

									{technique.software_package && (
										<div>
											<h3 className="text-sm font-medium">
												Software Package
											</h3>

											<a
												href={
													technique.software_package
												}
												target="_blank"
												rel="noopener noreferrer"
												className="text-sm text-blue-600 hover:underline"
											>
												{technique.software_package}
											</a>
										</div>
									)}
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</div>
		</MainLayout>
	);
}
