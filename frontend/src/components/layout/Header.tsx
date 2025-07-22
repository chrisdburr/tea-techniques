"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { DarkModeToggle } from "@/lib/context/dark-mode";
import { Button } from "@/components/ui/button";
import { config } from "@/lib/config";
import { getFeatureFlags } from "@/lib/config/dataConfig";
import { Menu, X, LogIn, LogOut, Plus, LayoutDashboard } from "lucide-react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();
  const featureFlags = getFeatureFlags();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
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

          {/* Auth-aware buttons - hidden on mobile and in static mode */}
          {featureFlags.enableAuth && (
            <div className="hidden md:flex gap-2">
              {!isLoading && (
                <>
                  {isAuthenticated ? (
                    <>
                      {featureFlags.enableSubmission && (
                        <Button asChild variant="default" size="sm">
                          <Link href="/techniques/add">
                            <Plus size={16} className="mr-1" />
                            Add Technique
                          </Link>
                        </Button>
                      )}

                      {user?.isStaff && (
                        <Button asChild variant="outline" size="sm">
                          <a
                            href="/admin"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <LayoutDashboard size={16} className="mr-1" />
                            Admin
                          </a>
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                      >
                        <LogOut size={16} className="mr-1" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Button asChild variant="outline" size="sm">
                      <Link href="/login">
                        <LogIn size={16} className="mr-1" />
                        Login
                      </Link>
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* API button - hidden on mobile and in static mode */}
          {featureFlags.enableAuth && config.swaggerUrl && (
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
          )}

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
              {/* API Documentation - only in API mode */}
              {featureFlags.enableAuth && config.swaggerUrl && (
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
              )}

              {/* Auth links for mobile - only in API mode */}
              {featureFlags.enableAuth && !isLoading && (
                <>
                  {isAuthenticated ? (
                    <>
                      {featureFlags.enableSubmission && (
                        <li>
                          <Link
                            href="/techniques/add"
                            className="block px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Add Technique
                          </Link>
                        </li>
                      )}
                      {user?.isStaff && (
                        <li>
                          <a
                            href="/admin"
                            className="block px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Admin Dashboard
                          </a>
                        </li>
                      )}
                      <li>
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleLogout();
                          }}
                          className="block w-full text-left px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          Logout
                        </button>
                      </li>
                    </>
                  ) : (
                    <li>
                      <Link
                        href="/login"
                        className="block px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                    </li>
                  )}
                </>
              )}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
