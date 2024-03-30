import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// See https://clerk.com/docs/references/nextjs/auth-middleware
// for more information about configuring your Middleware

const signUpUrl = "/sign-up";
const legalUrl = "/legal";
const helplUrl = "/help";
const contributorsUrl = "/contributors";

export default authMiddleware({
  // I know that this is the sign up url, but I want to redirect everyone to the sign-up page,
  // because they can still navigate to the sign-in page there.
  signInUrl: "/sign-up",
  // Allow signed out users to access the specified routes:
  publicRoutes: [
    "/",
    signUpUrl,
    "/sign-in",
    "/api/sign-up",
    legalUrl,
    helplUrl,
    contributorsUrl,
  ],
  // Prevent the specified routes from accessing
  // authentication information:
  // ignoredRoutes: ['/no-auth-in-this-route'],
  async afterAuth(auth, req) {
    if (auth.isPublicRoute) {
      // Don't do anything for public routes
      return NextResponse.next();
    }

    const url = new URL(req.nextUrl.origin);

    if (!auth.userId) {
      // User is not signed in
      url.pathname = signUpUrl;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  },
});

export const config = {
  matcher: [
    // Exclude files with a "." followed by an extension, which are typically static files.
    // Exclude files in the _next directory, which are Next.js internals.

    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    // Re-include any files in the api or trpc folders that might have an extension
    "/(api|trpc)(.*)",
  ],
};
