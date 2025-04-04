import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DarkModeProvider } from "@/lib/context/dark-mode";
import { AuthProvider } from "@/lib/context/auth-context";
import { QueryProvider } from "@/lib/providers/query-provider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DismissibleBanner from "@/components/ui/DismissibleBanner";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "TEA Techniques",
	description: "Explore Techniques for Responsible AI Design, Development, and Deployment",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col`}
			>
				<QueryProvider>
					<AuthProvider>
						<DarkModeProvider>
							<DismissibleBanner message="This application is in active development and should not be shared publicly. Features are still being worked on and some content exists as a placeholder only." />
							<Header />
							<main className="flex-1 container mx-auto py-8 px-4">
								{children}
							</main>
							<Footer />
						</DarkModeProvider>
					</AuthProvider>
				</QueryProvider>
			</body>
		</html>
	);
}
