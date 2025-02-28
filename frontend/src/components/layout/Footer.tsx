import React from "react";
import Link from "next/link";
import * as Constants from "@/lib/constants";


const Footer = () => {
  return (
		<footer className="border-t border-border bg-background">
			<div className="container mx-auto py-8 px-4">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div>
						<h3 className="text-lg font-semibold mb-4">
							{Constants.APP_TITLE}
						</h3>
						<p className="text-muted-foreground text-sm">
							{Constants.APP_DESCRIPTION}
						</p>
					</div>
					<div>
						<h3 className="text-lg font-semibold mb-4">Links</h3>
						<ul className="space-y-2 text-sm">
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
					</div>
					<div>
						<h3 className="text-lg font-semibold mb-4">
							Resources
						</h3>
						<ul className="space-y-2 text-sm">
							<li>
								<Link
									href="/api"
									className="text-muted-foreground hover:text-foreground"
								>
									API Documentation
								</Link>
							</li>
							<li>
								<a
									href="https://github.com/chrisdburr/tea-XAI-demo"
									target="_blank"
									rel="noopener noreferrer"
									className="text-muted-foreground hover:text-foreground"
								>
									GitHub Repository
								</a>
							</li>
						</ul>
					</div>
				</div>
				<div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
					<p>
						© {new Date().getFullYear()} {Constants.APP_TITLE}. All
						rights reserved.
					</p>
				</div>
			</div>
		</footer>
  );
};

export default Footer;