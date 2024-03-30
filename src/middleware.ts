import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// See https://clerk.com/docs/references/nextjs/auth-middleware
// for more information about configuring your Middleware

const signInUrl = "/sign-in";

export default authMiddleware({
  signInUrl: signInUrl,
  // Allow signed out users to access the specified routes:
  publicRoutes: ["/", signInUrl],
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
      url.pathname = signInUrl;
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
