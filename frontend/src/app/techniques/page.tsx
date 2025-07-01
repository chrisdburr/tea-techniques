// src/app/techniques/page.tsx
import MainLayout from "@/components/layout/MainLayout";
import TechniquesList from "@/components/technique/TechniquesList";

export default function TechniquesPage() {
	return (
		<MainLayout>
			<TechniquesList />
		</MainLayout>
	);
}