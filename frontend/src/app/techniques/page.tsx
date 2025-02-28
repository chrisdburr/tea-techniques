// src/app/techniques/page.tsx
"use client";

import { Suspense } from "react";
import MainLayout from "@/components/layout/MainLayout";
import TechniquesList from "@/components/technique/TechniquesList";

// Loading component
function LoadingState() {
	return (
		<div className="flex justify-center items-center min-h-[400px]">
			<p className="text-lg text-muted-foreground">
				Loading techniques...
			</p>
		</div>
	);
}

export default function TechniquesPage() {
	return (
		<MainLayout>
			<Suspense fallback={<LoadingState />}>
				<TechniquesList />
			</Suspense>
		</MainLayout>
	);
}
