// src/app/about/page.tsx
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	getMarkdownContent,
	extractSections,
	mapSectionsToTabs,
} from "@/lib/markdown";

// This is a Server Component, so we can fetch data here
export default async function AboutPage() {
	// Read and parse the README.md file
	const { content } = await getMarkdownContent("README.md");

	// Extract sections and map them to tabs with HTML conversion
	const sections = extractSections(content);
	const tabContent = await mapSectionsToTabs(sections);

	return (
		<MainLayout>
			<div className="space-y-8 max-w-4xl mx-auto">
				<div>
					<h1 className="text-3xl font-bold mb-4">
						About TEA Techniques
					</h1>
					<p className="text-muted-foreground text-lg">
						A platform for exploring techniques for evidencing
						claims about responsible design, development, and
						deployment of data-driven technologies.
					</p>
				</div>

				<Tabs defaultValue="project-info" className="w-full">
					<TabsList>
						<TabsTrigger value="project-info">
							Project Information
						</TabsTrigger>
						<TabsTrigger value="developer-instructions">
							Developer Instructions
						</TabsTrigger>
					</TabsList>

					<TabsContent
						value="project-info"
						className="space-y-8 py-4"
					>
						<section>
							<h2 className="text-2xl font-bold mb-4">
								Project Overview
							</h2>
							<div className="prose max-w-none">
								<div
									dangerouslySetInnerHTML={{
										__html: tabContent.projectInfo.overview,
									}}
								/>
							</div>
						</section>

						<section>
							<h2 className="text-2xl font-bold mb-4">
								Key Features
							</h2>
							<div className="prose max-w-none">
								<div
									dangerouslySetInnerHTML={{
										__html: tabContent.projectInfo.features,
									}}
								/>
							</div>
						</section>
					</TabsContent>

					<TabsContent
						value="developer-instructions"
						className="space-y-8 py-4"
					>
						<section>
							<h2 className="text-2xl font-bold mb-4">
								Development Setup
							</h2>
							<div className="prose max-w-none">
								<div
									dangerouslySetInnerHTML={{
										__html: tabContent.developerInstructions
											.development,
									}}
								/>
							</div>
						</section>

						<section>
							<h2 className="text-2xl font-bold mb-4">
								Project Structure
							</h2>
							<div className="prose max-w-none">
								<div
									dangerouslySetInnerHTML={{
										__html: tabContent.developerInstructions
											.projectStructure,
									}}
								/>
							</div>
						</section>

						<section>
							<h2 className="text-2xl font-bold mb-4">Testing</h2>
							<div className="prose max-w-none">
								<div
									dangerouslySetInnerHTML={{
										__html: tabContent.developerInstructions
											.testing,
									}}
								/>
							</div>
						</section>
					</TabsContent>
				</Tabs>

				<div className="flex justify-center py-6">
					<Button asChild>
						<Link href="/techniques">Explore Techniques</Link>
					</Button>
				</div>
			</div>
		</MainLayout>
	);
}
