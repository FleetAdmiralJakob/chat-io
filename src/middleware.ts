import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// See https://clerk.com/docs/references/nextjs/clerk-middleware
// for more information about configuring your Middleware

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-up",
  "/legal",
  "/contributors",
  "/sign-in",
  "/reset-password",
]);
const isApiRoute = createRouteMatcher(["/api/(.*)"]);

export default clerkMiddleware(
  async (auth, req) => {
    if (isApiRoute(req)) return NextResponse.next();

    const { userId, redirectToSignIn } = await auth();
    const isPublic = isPublicRoute(req);

    if (!userId && !isPublic) redirectToSignIn();
    if (!isPublic) await auth.protect();

    return NextResponse.next();
  },
  { signInUrl: "/sign-up", signUpUrl: "/sign-up" },
);

export const config = {
  matcher: [
    // Exclude files with a "." followed by an extension, which are typically static files.
    // Exclude files in the _next directory, which are Next.js internals.

    "/((?!.*\\..*|_next).*)",
    "/",
    // Re-include any files in the api or trpc folders that might have an extension
    "/(api|trpc)(.*)",
  ],
};
