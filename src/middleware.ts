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
]);
const isApiRoute = createRouteMatcher(["/api/(.*)"]);
const isRootRoute = createRouteMatcher(["/"]);

export default clerkMiddleware(
  async (auth, req) => {
    if (isApiRoute(req)) return NextResponse.next();

    const { userId, redirectToSignIn } = await auth();
    const isPublic = isPublicRoute(req);

    if (!userId && !isPublic) redirectToSignIn();
    if (!isPublic) await auth.protect();

    if (isRootRoute(req) && userId) {
      return NextResponse.redirect(new URL("/chats", req.url));
    }

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
