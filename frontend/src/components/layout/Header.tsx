import React, { useState } from "react";
import Link from "next/link";
import { DarkModeToggle } from "@/lib/context/dark-mode";
import { Button } from "@/components/ui/button";
import { config } from "@/lib/config";
import { Menu, X } from "lucide-react";

const Header = () => {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const toggleMobileMenu = () => {
		setMobileMenuOpen(!mobileMenuOpen);
	};

	return (
		<header className="border-b border-border bg-background">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				<div className="flex items-center gap-6">
					<Link href="/" className="text-xl font-bold">
						TEA Techniques
					</Link>

					{/* Desktop navigation - hidden on mobile */}
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

					{/* API button - hidden on mobile */}
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

					{/* Mobile menu button - only visible on mobile */}
					<Button
						variant="outline"
						size="icon"
						className="md:hidden"
						onClick={toggleMobileMenu}
						aria-label="Toggle menu"
					>
						{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
					</Button>
				</div>
			</div>

			{/* Mobile menu - slides in from the top when open */}
			{mobileMenuOpen && (
				<div className="md:hidden">
					<nav className="flex flex-col border-b border-border bg-background">
						<ul className="flex flex-col py-4">
							<li>
								<Link
									href="/categories"
									className="block px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground"
									onClick={() => setMobileMenuOpen(false)}
								>
									Categories
								</Link>
							</li>
							<li>
								<Link
									href="/techniques"
									className="block px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground"
									onClick={() => setMobileMenuOpen(false)}
								>
									Browse Techniques
								</Link>
							</li>
							<li>
								<Link
									href="/about"
									className="block px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground"
									onClick={() => setMobileMenuOpen(false)}
								>
									About
								</Link>
							</li>
							<li>
								<a
									href={config.swaggerUrl}
									className="block px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground"
									target="_blank"
									rel="noopener noreferrer"
									onClick={() => setMobileMenuOpen(false)}
								>
									API Documentation
								</a>
							</li>
						</ul>
					</nav>
				</div>
			)}
		</header>
	);
};

export default Header;
