import "~/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { ourFileRouter } from "~/app/api/uploadthing/core";
import ConvexClientProvider from "~/app/convex-client-provider";
import { ThemeProvider } from "~/components/theme-provider";
import { Toaster } from "~/components/ui/sonner";
import { cn } from "~/lib/utils";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache/provider";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import React from "react";
import { Monitoring } from "react-scan/monitoring/next";
import { extractRouterConfig } from "uploadthing/server";
import { CSPostHogProvider } from "./_analytics/provider";

const APP_NAME = "Chat.io";
const APP_DEFAULT_TITLE = "Chat.io";
const APP_TITLE_TEMPLATE = "%s - Chat.io";
const APP_DESCRIPTION = "Best PWA app in the world!";

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

export const dynamic = "force-static";

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
          "min-h-screen bg-background antialiased",
        )}
      >
        <Monitoring
          apiKey="w-1y_WGLno534NOfDIi-JKYqMI4xpUf_"
          url="https://monitoring.react-scan.com/api/v1/ingest"
          // eslint-disable-next-line no-restricted-properties
          commit={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA}
          // eslint-disable-next-line no-restricted-properties
          branch={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF}
        />
        <NextSSRPlugin
          /**
           * The `extractRouterConfig` will extract **only** the route configs
           * from the router to prevent additional information from being
           * leaked to the client. The data passed to the client is the same
           * as if you were to fetch `/api/uploadthing` directly.
           */
          routerConfig={extractRouterConfig(ourFileRouter)}
        />
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
                </ConvexQueryCacheProvider>
              </ConvexClientProvider>
            </CSPostHogProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
