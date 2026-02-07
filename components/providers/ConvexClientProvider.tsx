"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.cloud";

const convex = new ConvexReactClient(convexUrl);

const hasValidClerkKey =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_");

function ConvexClerkProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

/**
 * Root provider that wraps the app with theme, Clerk auth, and Convex real-time backend.
 *
 * Provider hierarchy:
 * ThemeProvider -> ClerkProvider -> ConvexProviderWithClerk -> App
 *
 * When Clerk keys are not configured (e.g., during initial setup),
 * renders children without auth to allow the app to build and display
 * the landing page.
 */
export default function Providers({ children }: { children: ReactNode }) {
  if (!hasValidClerkKey) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ClerkProvider>
        <ConvexClerkProvider>{children}</ConvexClerkProvider>
      </ClerkProvider>
    </ThemeProvider>
  );
}
