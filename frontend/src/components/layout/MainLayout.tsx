import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import DismissibleBanner from "@/components/ui/DismissibleBanner";

interface MainLayoutProps {
	children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
	return (
		<div className="flex min-h-screen flex-col">
			<DismissibleBanner message="This application is in active development and should not be shared publicly. Features are still being worked on and some content exists as a placeholder only." />
			<Header />
			<main className="flex-1 container mx-auto py-8 px-4">
				{children}
			</main>
			<Footer />
		</div>
	);
};

export default MainLayout;
