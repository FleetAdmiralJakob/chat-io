"use client";

import { observer } from "@legendapp/state/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { env } from "~/env";
import { base64ToUint8Array } from "~/lib/utils";
import { notificationSettings$ } from "~/states";
import { useEffect, useState } from "react";

export const NotificationPermissionRequest = observer(() => {
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const initializeServiceWorker = async () => {
      if (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        window.serwist !== undefined
      ) {
        try {
          const reg = await navigator.serviceWorker.ready;
          setRegistration(reg);

          const sub = await reg.pushManager.getSubscription();
          if (
            sub &&
            !(
              sub.expirationTime &&
              Date.now() > sub.expirationTime - 5 * 60 * 1000
            )
          ) {
            notificationSettings$.subscription.set(sub);
            notificationSettings$.isEnabled.set(true);
          }
        } catch (error) {
          console.error("Failed to initialize service worker:", error);
        }
      }
    };

    void initializeServiceWorker();
  }, []);

  // Only show if we haven't prompted before and notifications aren't enabled
  if (
    notificationSettings$.hasPrompted.get() ||
    notificationSettings$.isEnabled.get()
  ) {
    return null;
  }

  const handleInitialPrompt = async (accepted: boolean) => {
    notificationSettings$.hasPrompted.set(true);

    if (accepted) {
      if (!env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || !registration) {
        console.error(
          "Missing requirements for push notifications",
          registration,
        );
        return;
      }

      try {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToUint8Array(
            env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
          ),
        });

        // TODO: Call your API to save the subscription on the server

        notificationSettings$.subscription.set(subscription);
        notificationSettings$.isEnabled.set(true);
      } catch (error) {
        console.error("Failed to subscribe to push notifications:", error);
      }
    }
  };

  return (
    <Card className="mx-auto my-4 w-full max-w-md">
      <CardHeader>
        <CardTitle>Enable Push Notifications?</CardTitle>
        <CardDescription>
          Stay updated with important information and updates.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-end space-x-4">
        <button
          onClick={() => handleInitialPrompt(false)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Not Now
        </button>
        <button
          onClick={() => handleInitialPrompt(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Enable
        </button>
      </CardContent>
    </Card>
  );
});
