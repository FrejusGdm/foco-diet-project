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
} from "lucide-react";
import { useState, type ReactNode, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Meal Planner", href: "/meal-planner", icon: UtensilsCrossed },
  { label: "Preferences", href: "/preferences", icon: Settings },
];

const isClerkConfigured =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 20;

/**
 * Auth-aware wrapper components.
 * When Clerk is configured, renders children only when user is signed in/out.
 * When Clerk is not configured, renders nothing for SignedIn (since no auth),
 * and renders children for SignedOut (fallback to unauthenticated state).
 */
function AuthSignedIn({ children }: { children: ReactNode }) {
  if (!isClerkConfigured) return null;
  const { SignedIn } = require("@clerk/nextjs");
  return <SignedIn>{children}</SignedIn>;
}

function AuthSignedOut({ children }: { children: ReactNode }) {
  if (!isClerkConfigured) return <>{children}</>;
  const { SignedOut } = require("@clerk/nextjs");
  return <SignedOut>{children}</SignedOut>;
}

function AuthUserButton() {
  if (!isClerkConfigured) return null;
  const { UserButton } = require("@clerk/nextjs");
  return (
    <UserButton
      afterSignOutUrl="/"
      appearance={{ elements: { avatarBox: "h-8 w-8" } }}
    />
  );
}

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Salad className="h-6 w-6 text-emerald-600" />
          <span className="hidden font-bold sm:inline-block">
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
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-2",
                      isActive && "bg-secondary font-medium"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </AuthSignedIn>

        {/* Right side */}
        <div className="ml-auto flex items-center space-x-4">
          <AuthSignedIn>
            <AuthUserButton />
          </AuthSignedIn>
          <AuthSignedOut>
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </AuthSignedOut>

          {/* Mobile menu toggle */}
          <AuthSignedIn>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        </AuthSignedIn>
      )}
    </header>
  );
}
