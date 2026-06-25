"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, User } from "lucide-react";
import { logoutUser } from "@/lib/api/auth";
import { useAuth } from "@/app/layouts/AuthProvider";
import ThemeToggle from "@/app/components/ThemeToggle";
import { cn } from "@/lib/cn";

const Header: React.FC = () => {
  const { isLoggedIn, user, reloadUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
      await reloadUser();
      setIsMobileMenuOpen(false);
      router.push("/");
    } catch (err) {
      if (err instanceof Error) {
        console.error("Logout error:", err.message);
      }
    }
  };

  const navLink = (href: string, label: string, mobile = false) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          "rounded-md px-3 py-2 text-sm font-medium transition-colors",
          mobile ? "block" : "",
          active
            ? "text-foreground bg-surface-muted"
            : "text-muted-foreground hover:text-foreground hover:bg-surface-muted"
        )}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-accent-foreground text-xs font-bold">
            T
          </span>
          Task Manager
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {navLink("/", "Home")}
          {isLoggedIn && navLink("/dashboard", "Dashboard")}
          {!isLoggedIn ? (
            navLink("/login", "Login / Sign Up")
          ) : (
            <div className="ml-2 flex items-center gap-2">
              <span className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground">
                <User className="h-4 w-4 text-muted-foreground" />
                {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-muted cursor-pointer"
              >
                Logout
              </button>
            </div>
          )}
          <div className="ml-1">
            <ThemeToggle />
          </div>
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Toggle menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface-muted cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-border bg-background px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-1">
            {navLink("/", "Home", true)}
            {isLoggedIn && navLink("/dashboard", "Dashboard", true)}
            {!isLoggedIn ? (
              navLink("/login", "Login / Sign Up", true)
            ) : (
              <button
                onClick={handleLogout}
                className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-muted cursor-pointer"
              >
                Logout ({user?.username})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
