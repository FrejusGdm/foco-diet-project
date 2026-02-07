import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware that protects authenticated routes using Clerk.
 *
 * When Clerk is properly configured (valid publishable key),
 * it uses clerkMiddleware to enforce authentication on non-public routes.
 * When Clerk is not configured, it passes all requests through.
 */

const publicRoutes = ["/", "/sign-in", "/sign-up"];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

const hasValidClerkKey =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 20 &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_");

let clerkMiddlewareHandler: ((request: NextRequest) => Promise<NextResponse>) | null = null;

if (hasValidClerkKey) {
  // Only import Clerk middleware when keys are valid
  try {
    const { clerkMiddleware, createRouteMatcher } = require("@clerk/nextjs/server");
    const isPublicMatcher = createRouteMatcher([
      "/",
      "/sign-in(.*)",
      "/sign-up(.*)",
    ]);
    clerkMiddlewareHandler = clerkMiddleware(async (auth: { protect: () => Promise<void> }, request: NextRequest) => {
      if (!isPublicMatcher(request)) {
        await auth.protect();
      }
    });
  } catch {
    // Clerk not available
  }
}

export default async function middleware(request: NextRequest) {
  if (clerkMiddlewareHandler) {
    return clerkMiddlewareHandler(request);
  }

  // Without Clerk, only allow public routes
  if (!isPublicRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
