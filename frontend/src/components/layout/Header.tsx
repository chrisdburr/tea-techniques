import React from "react";
import Link from "next/link";
import { DarkModeToggle } from "@/lib/context/dark-mode";
import { Button } from "@/components/ui/button";
import { config } from "@/lib/config";

const Header = () => {
	return (
		<header className="border-b border-border bg-background">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				<div className="flex items-center gap-6">
					<Link href="/" className="text-xl font-bold">
						TEA Techniques
					</Link>
					<nav className="hidden md:block">
						<ul className="flex gap-6">
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
									href="/techniques"
									className="text-muted-foreground hover:text-foreground"
								>
									Browse Techniques
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
						<a
							href={config.swaggerUrl}
							target="_blank"
							rel="noopener noreferrer"
						>
							API Documentation
						</a>
					</Button>
				</div>
			</div>
		</header>
	);
};

export default Header;
