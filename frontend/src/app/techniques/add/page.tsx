// src/app/techniques/add/page.tsx
"use client";

import React from "react";
import TechniqueForm from "@/components/technique/TechniqueForm";
import MainLayout from "@/components/layout/MainLayout";

export default function AddTechniquePage() {
	return (
		<MainLayout>
			<div className="container mx-auto p-4 max-w-4xl">
				<TechniqueForm isEditMode={false} />
			</div>
		</MainLayout>
	);
}
