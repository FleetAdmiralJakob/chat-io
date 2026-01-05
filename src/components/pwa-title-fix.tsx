"use client";

import { useEffect } from "react";

/**
 * PWATitleFix component
 *
 * Fixes duplicate app name in PWA window titles.
 *
 * Problem: When running as an installed PWA, browsers like Edge prepend the app name
 * from the manifest to the document title, causing "Chat.io - Profile - Chat.io"
 *
 * Solution: Detect standalone display mode and remove the " - Chat.io" suffix
 * from the document title, so it becomes just "Profile" which then displays as
 * "Chat.io - Profile" in the PWA window.
 */
export function PWATitleFix() {
  useEffect(() => {
    // Check if running in standalone mode (installed PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error - Safari-specific property for iOS PWAs
      window.navigator.standalone === true;

    if (!isStandalone) return;

    const APP_NAME_SUFFIX = " - Chat.io";

    // Function to fix the title
    const fixTitle = () => {
      if (document.title.endsWith(APP_NAME_SUFFIX)) {
        document.title = document.title.slice(0, -APP_NAME_SUFFIX.length);
      }
    };

    // Fix the initial title
    fixTitle();

    // Observe title changes using MutationObserver on the <title> element
    const titleElement = document.querySelector("title");
    if (titleElement) {
      const observer = new MutationObserver(() => {
        fixTitle();
      });

      observer.observe(titleElement, {
        childList: true,
        characterData: true,
        subtree: true,
      });

      return () => observer.disconnect();
    }
  }, []);

  return null;
}
