/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

/**
 * This declares the value of `injectionPoint` to TypeScript.
 * `injectionPoint` is the string that will be replaced by the
 * actual precache manifest. By default, this string is set to
 * `"self.__SW_MANIFEST"`.
 */
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Initialize Serwist service worker with precaching and runtime caching.
 * This sets up the core service worker functionality for the PWA.
 */
const serwist = new Serwist({
  // Precache entries injected at build time by Serwist
  precacheEntries: self.__SW_MANIFEST,
  // Activate the new service worker immediately without waiting for tabs to close
  skipWaiting: true,
  // Take control of all clients (pages) as soon as the service worker activates
  clientsClaim: true,
  // Enable navigation preload to speed up navigation requests
  navigationPreload: true,
  // Use default caching strategies for runtime requests (images, fonts, etc.)
  runtimeCaching: defaultCache,
  // TODO: Make a fallback page
  /*
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
   */
});

// Register all Serwist event listeners (fetch, install, activate, etc.)
serwist.addEventListeners();

/**
 * Handle incoming push notifications from the server.
 * This listener is triggered when the service worker receives a push event,
 * typically sent from the backend via a push service (e.g., FCM, Web Push).
 */
self.addEventListener("push", (event) => {
  // Define the expected structure of the notification data
  let data: { title: string; body: string; data: unknown };

  try {
    // Attempt to parse the push event payload as JSON
    // If event.data is null/undefined, use a fallback empty notification object
    // The 'as' assertion is necessary because @total-typescript/ts-reset makes
    // JSON.parse return 'unknown' instead of 'any' for better type safety
    data = JSON.parse(
      event.data?.text() ?? '{"title":"","body":"","data":null}',
    ) as {
      title: string;
      body: string;
      data: unknown;
    };
  } catch {
    // If JSON parsing fails (malformed data), fallback to an empty notification
    // This prevents the service worker from crashing due to unexpected payloads
    data = { title: "", body: "", data: null };
  }

  // Keep the service worker alive until the notification is displayed
  // This ensures the notification shows even if the page is closed
  event.waitUntil(
    (async () => {
      // Check if the user is currently viewing the chat
      // If so, we don't want to show a notification
      if (isNotificationData(data.data) && data.data.url) {
        const urlToCheck = data.data.url;
        const clientList = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        const isChatOpen = clientList.some(
          (client) =>
            new URL(client.url).pathname === urlToCheck &&
            client.visibilityState === "visible",
        );

        if (isChatOpen) {
          return;
        }
      }

      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/icons/icon-512x-512-any.png", // App icon shown in the notification
        data: data.data, // Custom data attached to the notification (e.g., URL to open)
      });
    })(),
  );
});

/**
 * Type guard to check if a value is a valid NotificationData object.
 * Ensures the data has the expected shape before accessing its properties.
 */
interface NotificationData {
  url?: string;
}

function isNotificationData(data: unknown): data is NotificationData {
  return (
    typeof data === "object" &&
    data !== null &&
    // Either url is undefined, or it's a string
    (("url" in data && typeof data.url === "string") || !("url" in data))
  );
}

/**
 * Handle notification click events.
 * When a user clicks on a notification, this handler:
 * 1. Closes the notification
 * 2. Tries to focus an existing app window/tab
 * 3. If no matching window exists, opens a new one
 */
self.addEventListener("notificationclick", (event) => {
  // Close the clicked notification
  event.notification.close();

  // Extract and validate the URL from the notification's custom data
  const rawData: unknown = event.notification.data;
  let url = "/"; // Default fallback URL

  // Type-safely extract the URL if the data structure is valid
  if (isNotificationData(rawData) && rawData.url !== undefined) {
    url = rawData.url;
  }

  // Keep the service worker alive until the window management is complete
  event.waitUntil(
    self.clients
      // Get all window clients (browser tabs/windows) that this service worker controls
      // includeUncontrolled: true includes windows that haven't been claimed yet
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an existing window/tab that matches the target URL
        for (const client of clientList) {
          try {
            // If we find a matching window, focus it instead of opening a new one
            if (new URL(client.url).pathname === url && "focus" in client) {
              return client.focus();
            }
          } catch {
            // Skip clients with malformed URLs
            continue;
          }
        }

        // If no matching window was found, open a new one with the target URL
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});
