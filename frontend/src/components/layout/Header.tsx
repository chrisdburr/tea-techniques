import React from "react";
import Link from "next/link";
import { DarkModeToggle } from "@/lib/context/dark-mode";
import { Button } from "@/components/ui/button";

const Header = () => {
	return (
		<header className="border-b border-border bg-background">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				<div className="flex items-center gap-6">
					<Link href="/" className="text-xl font-bold">
						TEA XAI Techniques
					</Link>
					<nav className="hidden md:block">
						<ul className="flex gap-6">
							<li>
								<Link
									href="/techniques"
									className="text-muted-foreground hover:text-foreground"
								>
									Techniques
								</Link>
							</li>
							<li>
								<Link
									href="/categories"
									className="text-muted-foreground hover:text-foreground"
								>
									Categories
								</Link>
							</li>
							<li>
								<Link
									href="/about"
									className="text-muted-foreground hover:text-foreground"
								>
									About
								</Link>
							</li>
						</ul>
					</nav>
				</div>
				<div className="flex items-center gap-4">
					<DarkModeToggle />
					<Button
						asChild
						variant="outline"
						size="sm"
						className="hidden md:flex"
					>
						<Link href="/api">API Documentation</Link>
					</Button>
				</div>
			</div>
		</header>
	);
};

export default Header;
