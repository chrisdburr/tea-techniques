import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DarkModeProvider } from "@/lib/context/dark-mode";
import { QueryProvider } from "@/lib/providers/query-provider";
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
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<QueryProvider>
					<DarkModeProvider>{children}</DarkModeProvider>
				</QueryProvider>
			</body>
		</html>
	);
}
