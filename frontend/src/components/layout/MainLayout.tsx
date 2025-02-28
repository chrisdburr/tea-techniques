import React from "react";
import Header from "./Header";
import Footer from "./Footer";

interface MainLayoutProps {
	children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
	return (
		<div className="flex min-h-screen flex-col">
			<Header />
			<main className="flex-1 container mx-auto py-8 px-4">
				{children}
			</main>
			<Footer />
		</div>
	);
};

export default MainLayout;
