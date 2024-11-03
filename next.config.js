import { fileURLToPath } from "node:url";
import withSerwistInit from "@serwist/next";
import createJiti from "jiti";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
});

const jiti = createJiti(fileURLToPath(import.meta.url));

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
jiti("./src/env.ts");

/** @type {import("next").NextConfig} */
const config = withSerwist({
  transpilePackages: ["geist"],
  experimental: {
    reactCompiler: true,
  },
});

export default config;
