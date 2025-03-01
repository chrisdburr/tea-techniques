// src/app/techniques/[id]/edit/page.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import TechniqueForm from "@/components/technique/TechniqueForm";
import { useTechniqueDetail } from "@/lib/api/hooks";

export default function EditTechniquePage() {
	const params = useParams();
	const id = Number(params.id);

	// Fetch the technique data
	const { data: technique, isLoading, error } = useTechniqueDetail(id);

	return (
		<MainLayout>
			<div className="container mx-auto p-4 max-w-4xl">
				{isLoading ? (
					<div className="flex justify-center items-center min-h-[400px]">
						<p className="text-muted-foreground">
							Loading technique data...
						</p>
					</div>
				) : error ? (
					<div className="flex flex-col items-center justify-center min-h-[400px]">
						<h1 className="text-2xl font-bold mb-4">
							Error Loading Technique
						</h1>
						<p className="text-muted-foreground mb-4">
							There was a problem loading this technique.
						</p>
						<p className="text-sm text-red-500">
							{error instanceof Error
								? error.message
								: "Unknown error"}
						</p>
					</div>
				) : (
					<TechniqueForm technique={technique} isEditMode={true} />
				)}
			</div>
		</MainLayout>
	);
}
