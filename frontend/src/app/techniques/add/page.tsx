// src/app/techniques/add/page.tsx
"use client";

import React from "react";
import TechniqueForm from "@/components/technique/TechniqueForm";
import MainLayout from "@/components/layout/MainLayout";

export default function AddTechniquePage() {
	return (
		<MainLayout>
			<div className="container mx-auto p-4">
				<h1 className="text-2xl font-bold mb-4">Add New Technique</h1>
				<TechniqueForm />
			</div>
		</MainLayout>
	);
}
