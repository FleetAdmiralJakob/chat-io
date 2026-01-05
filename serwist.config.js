// @ts-check
// import { spawnSync } from "node:child_process";
// If you want to use the fully resolved Next.js
// configuration to resolve Serwist configuration,
// use `serwist.withNextConfig` instead.
import { serwist } from "@serwist/next/config";

// Using `git rev-parse HEAD` might not the most efficient
// way of determining a revision. You may prefer to use
// the hashes of every extra file you precache.
/*
const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout ??
  crypto.randomUUID();
 */

export default serwist.withNextConfig((nextConfig) => ({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  // If you want to precache any other page that is not
  // already detected by Serwist, add them here. Otherwise,
  // delete `revision`.
  // additionalPrecacheEntries: [{ url: "/precached", revision }],
  globIgnores: [
    `${nextConfig.distDir}/server/pages/**/*.json`,
    `${nextConfig.distDir}/server/app/ignored.html`,
  ],
}));
