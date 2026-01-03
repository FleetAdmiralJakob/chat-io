import { fileURLToPath } from "node:url";
import { withSentryConfig } from "@sentry/nextjs";
import withSerwistInit from "@serwist/next";
import { createJiti } from "jiti";
import { withAxiom } from "next-axiom";
import ReactComponentName from "react-scan/react-component-name/webpack";

// @ts-check

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
});

const jiti = createJiti(fileURLToPath(import.meta.url));

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await jiti.import("./src/env.ts");

/** @type {import("next").NextConfig} */
const baseConfig = withAxiom(
  withSerwist({
    transpilePackages: ["geist"],
    reactCompiler: true,
    async redirects() {
      return [
        {
          source: "/github",
          destination: "https://github.com/FleetAdmiralJakob/chat-io",
          permanent: true,
        },
      ];
    },
    async rewrites() {
      return [
        {
          source: "/home",
          destination: "/",
        },
        {
          source: "/ingest/static/:path*",
          destination: process.env.NEXT_PUBLIC_POSTHOG_HOST + "/static/:path*",
        },
        {
          source: "/ingest/:path*",
          destination: process.env.NEXT_PUBLIC_POSTHOG_HOST + "/:path*",
        },
        {
          source: "/ingest/decide",
          destination: process.env.NEXT_PUBLIC_POSTHOG_HOST + "/decide",
        },
      ];
    },
    // This is required to support PostHog trailing slash API requests
    skipTrailingSlashRedirect: true,

    // Next.js being Next.js and not providing any type definitions for their own config
    webpack: (config) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      config.plugins.push(ReactComponentName({}));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return config;
    },
  }),
);

const config = withSentryConfig(baseConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "jakob-rossner",
  project: "chat-io",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  sourcemaps: {
    disable: false,
    deleteSourcemapsAfterUpload: true,
  },

  // Webpack-specific options (moved from top-level for Sentry v10)
  webpack: {
    // Automatically annotate React components to show their full name in breadcrumbs and session replay
    reactComponentAnnotation: {
      enabled: true,
    },

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shake Sentry logger statements to reduce bundle size
    treeshake: {
      removeDebugLogging: true,
    },
  },
});

export default config;
