import "~/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "~/app/convex-client-provider";
import { PWATitleFix } from "~/components/pwa-title-fix";
import { ThemeProvider } from "~/components/theme-provider";
import { Toaster } from "~/components/ui/sonner";
import { cn } from "~/lib/utils";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache/provider";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import React, { Suspense } from "react";
import { Monitoring } from "react-scan/monitoring/next";
import { CSPostHogProvider } from "./_analytics/provider";
import { SerwistProvider } from "./serwist-provider";

const APP_NAME = "Chat.io";
const APP_DEFAULT_TITLE = "Chat.io";
const APP_TITLE_TEMPLATE = "%s - Chat.io";
const APP_DESCRIPTION = "Best messaging PWA app in the world!";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#101010" },
  ],
};

// MIGRATED: Removed export const dynamic = 'force-static' (incompatible with Cache Components)
// With Cache Components, everything is dynamic by default. Add "use cache" to pages/components that should be cached.

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://unpkg.com/react-scan/dist/install-hook.global.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={cn(
          GeistSans.className,
          "bg-background min-h-screen antialiased",
        )}
      >
        <SerwistProvider swUrl="/sw.js">
          <Monitoring
            apiKey="w-1y_WGLno534NOfDIi-JKYqMI4xpUf_"
            url="https://monitoring.react-scan.com/api/v1/ingest"
            // eslint-disable-next-line no-restricted-properties
            commit={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA}
            // eslint-disable-next-line no-restricted-properties
            branch={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF}
          />
          <Suspense fallback={<div className="min-h-screen" />}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <ClerkProvider dynamic>
                <CSPostHogProvider>
                  <ConvexClientProvider>
                    <ConvexQueryCacheProvider>
                      <NuqsAdapter>{children}</NuqsAdapter>
                      <Toaster />
                      <PWATitleFix />
                    </ConvexQueryCacheProvider>
                  </ConvexClientProvider>
                </CSPostHogProvider>
              </ClerkProvider>
            </ThemeProvider>
          </Suspense>
        </SerwistProvider>
      </body>
    </html>
  );
}
