"use client";

import { Suspense, useState } from "react"; // Import Suspense
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import MainLayout from "@/components/layout/MainLayout";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

// Define a loading component for Suspense
function LoginPageLoadingSkeleton() {
	return (
		<MainLayout>
			<div className="max-w-md mx-auto py-12">
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-1/4 mb-2" />
						<Skeleton className="h-4 w-3/4" />
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Skeleton className="h-4 w-1/4" />
							<Skeleton className="h-9 w-full" />
						</div>
						<div className="space-y-2">
							<Skeleton className="h-4 w-1/4" />
							<Skeleton className="h-9 w-full" />
						</div>
						<Skeleton className="h-9 w-full mt-2" />
						<Skeleton className="h-9 w-full mt-4" />
					</CardContent>
					<CardFooter className="flex justify-center">
						<Skeleton className="h-4 w-1/2" />
					</CardFooter>
				</Card>
			</div>
		</MainLayout>
	);
}

// The component that actually uses the hooks
function LoginPageContent() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [errorMsg, setErrorMsg] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { login } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams(); // Hook usage is here
	const redirectPath = searchParams.get("redirect") || "/";

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrorMsg("");
		setIsSubmitting(true);

		try {
			await login(username, password);
			router.push(redirectPath);
		} catch (error: unknown) {
			const errorMessage = "Login failed. Please check your credentials.";
			
			// Type-safe error handling
			if (error && typeof error === 'object' && 'response' in error) {
				const responseObj = error.response;
				if (responseObj && typeof responseObj === 'object' && 'data' in responseObj) {
					const dataObj = responseObj.data;
					if (dataObj && typeof dataObj === 'object' && 'detail' in dataObj) {
						setErrorMsg(dataObj.detail as string);
						setIsSubmitting(false);
						return;
					}
				}
			}
			
			setErrorMsg(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const goToAdminLogin = () => {
		window.location.href = "/admin";
	};

	return (
		<MainLayout>
			<div className="max-w-md mx-auto py-12">
				<Card>
					<CardHeader>
						<CardTitle>Login</CardTitle>
						<CardDescription>
							Enter your credentials to access protected features
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleLogin} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="username">Username</Label>
								<Input
									id="username"
									type="text"
									placeholder="Enter your username"
									value={username}
									onChange={(e) =>
										setUsername(e.target.value)
									}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									type="password"
									placeholder="Enter your password"
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									required
								/>
							</div>

							{errorMsg && (
								<div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm">
									{errorMsg}
								</div>
							)}

							<Button
								type="submit"
								className="w-full mt-2"
								disabled={isSubmitting}
							>
								{isSubmitting ? "Logging in..." : "Log in"}
							</Button>
						</form>

						<div className="flex items-center my-4">
							<div className="flex-grow border-t border-gray-200"></div>
							<span className="px-3 text-sm text-muted-foreground">
								Or
							</span>
							<div className="flex-grow border-t border-gray-200"></div>
						</div>

						<Button
							variant="outline"
							className="w-full"
							onClick={goToAdminLogin}
						>
							<ExternalLink size={16} className="mr-2" />
							Go to Django Admin Login
						</Button>
					</CardContent>
					<CardFooter className="flex justify-center">
						<p className="text-sm text-muted-foreground">
							Need access? Contact your administrator.
						</p>
					</CardFooter>
				</Card>
			</div>
		</MainLayout>
	);
}

// Export the page component, wrapping the content with Suspense
export default function LoginPage() {
	return (
		<Suspense fallback={<LoginPageLoadingSkeleton />}>
			<LoginPageContent />
		</Suspense>
	);
}