"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Settings,
  Salad,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Meal Planner", href: "/meal-planner", icon: UtensilsCrossed },
  { label: "Preferences", href: "/preferences", icon: Settings },
];

const isClerkConfigured =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_");

/**
 * Auth-aware wrapper components.
 * When Clerk is configured, renders children only when user is signed in/out.
 * When Clerk is not configured, renders nothing for SignedIn (since no auth),
 * and renders children for SignedOut (fallback to unauthenticated state).
 */
function AuthSignedIn({ children }: { children: ReactNode }) {
  if (!isClerkConfigured) return null;
  return <SignedIn>{children}</SignedIn>;
}

function AuthSignedOut({ children }: { children: ReactNode }) {
  if (!isClerkConfigured) return <>{children}</>;
  return <SignedOut>{children}</SignedOut>;
}

function AuthUserButton() {
  if (!isClerkConfigured) return null;
  return (
    <UserButton
      afterSignOutUrl="/"
      appearance={{ elements: { avatarBox: "h-8 w-8" } }}
    />
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Toggle theme">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Salad className="h-6 w-6 text-primary" />
          <span className="hidden font-display text-lg sm:inline-block">
            Foco Diet Planner
          </span>
        </Link>

        {/* Desktop Nav */}
        <AuthSignedIn>
          <nav className="hidden items-center space-x-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2",
                    isActive && "bg-secondary font-medium"
                  )}
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </AuthSignedIn>

        {/* Right side */}
        <div className="ml-auto flex items-center space-x-2">
          <ThemeToggle />
          <AuthSignedIn>
            <AuthUserButton />
          </AuthSignedIn>
          <AuthSignedOut>
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">
                Sign In
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </AuthSignedOut>

          {/* Mobile menu toggle */}
          <AuthSignedIn>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </AuthSignedIn>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <AuthSignedIn>
          <div className="border-t border-border/40 md:hidden">
            <nav className="flex flex-col space-y-1 p-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    asChild
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
            </nav>
          </div>
        </AuthSignedIn>
      )}
    </header>
  );
}
