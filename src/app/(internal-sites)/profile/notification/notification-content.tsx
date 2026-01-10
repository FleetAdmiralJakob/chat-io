"use client";

import { api } from "#convex/_generated/api";
import * as Sentry from "@sentry/nextjs";
import { Checkbox } from "~/components/ui/checkbox";
import { env } from "~/env";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const base64ToUint8Array = (base64: string) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(b64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function NotificationContent() {
  const router = useRouter();
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [subscriptionEndpoint, setSubscriptionEndpoint] = useState<
    string | null
  >(null);
  const subscribeToPush = useMutation(api.notifications.subscribe);
  const unsubscribeFromPush = useMutation(api.notifications.unsubscribe);

  // Query to verify subscription ownership - only runs when we have an endpoint
  const isSubscriptionOwned = useQuery(
    api.notifications.verifySubscriptionOwnership,
    subscriptionEndpoint ? { endpoint: subscriptionEndpoint } : "skip",
  );

  useEffect(() => {
    // Check if the browser supports notifications at all
    if (!("Notification" in window)) {
      return;
    }

    // Check if the user currently blocks notifications
    if (Notification.permission === "denied") {
      setIsPushEnabled(false);
      return;
    }

    // Check if service workers are supported
    if (!("serviceWorker" in navigator)) {
      return;
    }

    // Wait for the service worker to be fully registered and ready,
    // then check if we have an active push subscription
    void navigator.serviceWorker.ready.then((reg) => {
      void reg.pushManager.getSubscription().then((sub) => {
        if (sub && Notification.permission === "granted") {
          // Store the endpoint to trigger ownership verification
          setSubscriptionEndpoint(sub.endpoint);
        } else {
          // No subscription exists
          setSubscriptionEndpoint(null);
          setIsPushEnabled(false);
        }
      });
    });
  }, []);

  // Update isPushEnabled based on ownership verification
  useEffect(() => {
    if (subscriptionEndpoint !== null) {
      // Only enable if the backend confirms ownership
      setIsPushEnabled(isSubscriptionOwned === true);
    }
  }, [isSubscriptionOwned, subscriptionEndpoint]);

  const handlePushToggle = async (checked: boolean) => {
    if (checked && Notification.permission === "denied") {
      toast.error(
        "Notifications blocked. Please enable them in your browser settings.",
      );
      return;
    }

    setPushLoading(true);
    try {
      if (checked && !env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        throw new Error("VAPID Public Key not found");
      }

      const reg = await navigator.serviceWorker.ready;
      if (checked) {
        // Explicitly request permission before subscribing
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          throw new Error("Notification permission not granted");
        }

        // ------------------------------------------------------------------
        // STEP 1: BROWSER SUBSCRIPTION
        // ------------------------------------------------------------------
        // We first attempt to subscribe the user in the browser. This prompts
        // the user for permission (if not already granted) and talks to the
        // push service (FCM, APNs, etc.) to get a subscription object.
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToUint8Array(
            env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          ),
        });

        // Serialize keys for storage
        const p256dh = sub.getKey("p256dh");
        const auth = sub.getKey("auth");

        // Safety check: if keys are missing (rare), we can't use this subscription.
        // We must roll back immediately to avoid a "zombie" browser subscription
        // that is useless without keys.
        if (!p256dh || !auth) {
          await sub.unsubscribe();
          throw new Error("Missing keys");
        }

        try {
          // ------------------------------------------------------------------
          // STEP 2: BACKEND SUBSCRIPTION
          // ------------------------------------------------------------------
          // Now we send the subscription details to our Convex backend.
          // This is the critical "link" step.
          await subscribeToPush({
            endpoint: sub.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
              auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
            },
          });

          // ------------------------------------------------------------------
          // STEP 3: SUCCESS CONFIRMATION
          // ------------------------------------------------------------------
          // Only AFTER the backend confirms it has stored the subscription do
          // we update the UI state to "Enabled". This ensures the UI reflects
          // the true state of the system (Browser + Backend both ready).
          setIsPushEnabled(true);
          toast.success("Notifications enabled");
          setSubscriptionEndpoint(sub.endpoint);
        } catch (backendError) {
          // ------------------------------------------------------------------
          // ROLLBACK MECHANISM: COMPENSATING TRANSACTION
          // ------------------------------------------------------------------
          // If the backend fails (network error, validation, etc.), we are now
          // in an INCONSISTENT STATE:
          // - Browser: Subscribed (✅)
          // - Backend: Not Subscribed (❌)
          //
          // If we leave it this way, the browser thinks it's done, but we'll
          // never be able to send messages. The user sees "Error" toast, but
          //  the next time they try, `subscribe()` might fail or return existing
          // (which is fine, but cleaner to reset).
          //
          // FIX: We must UNDO the browser subscription to reset to a clean slate.
          // ------------------------------------------------------------------
          Sentry.captureException(backendError);

          try {
            // Retrieve the latest subscription to be absolutely sure we're
            // unsubscribing the right thing (though 'sub' should be valid).
            // Using getSubscription() as a fresh check.
            const currentSub = await reg.pushManager.getSubscription();
            if (currentSub) {
              await currentSub.unsubscribe();
            }
          } catch (rollbackError) {
            // If rollback fails, we are truly stuck. Log it for debugging.
            // We still re-throw the original error to inform the user of the initial failure.
            // This is a rare edge case (e.g. network lost mid-operation).
            Sentry.captureException(rollbackError);
          }

          // Re-throw the original backend error so the outer catch block
          // can handle the UI revert (toggling the switch back to off) and
          // showing the error toast to the user.
          throw backendError;
        }
      } else {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          // ------------------------------------------------------------------
          // CRITICAL ORDER OF OPERATIONS: BROWSER FIRST, THEN BACKEND
          // ------------------------------------------------------------------
          // We MUST unsubscribe from the browser (PushManager) BEFORE removing
          // the subscription from the backend database.
          //
          // Why?
          // 1. Browser Truth: The browser's PushManager is the ultimate source
          //    of truth for "is this device subscribed?". If we remove the DB
          //    record but the browser subscription remains active, the user
          //    is efficiently in a "zombie" state where they might still
          //    receive stray pushes (if the endpoint was leaked or another
          //    service uses it), but our app thinks they are unsubscribed.
          //
          // 2. Error Handling & UI Consistency:
          //    - If `sub.unsubscribe()` fails, the browser subscription is
          //      still active. We catch this in the outer block, revert the
          //      UI toggle to "on", and the user can try again. Correct.
          //    - If `sub.unsubscribe()` SUCCEEDS, the user is effectively
          //      unsubscribed on this device. Even if the backend call fails
          //      (network error, etc.), we should NOT revert the UI to "on".
          //      Doing so would lie to the user ("You are subscribed") when
          //      the browser will essentially reject any future pushes.
          //
          // By doing browser first, we ensure that a successful browser
          // unsubscription is treated as a success in the UI, regardless of
          // the backend's clean-up status (which is just garbage collection).
          // ------------------------------------------------------------------
          await sub.unsubscribe();

          try {
            await unsubscribeFromPush({ endpoint: sub.endpoint });
            setSubscriptionEndpoint(null);
          } catch (backendError) {
            // If the backend fails, we swallow the error and log it.
            // We do NOT want to throw here, because that would trigger the
            // outer catch block and revert the UI switch to "on".
            // Since the browser subscription is already gone, the user IS
            // unsubscribed for all intents and purposes. The orphaned DB
            // record will eventually be cleaned up (e.g., by a 410 Gone
            // response when the server tries to push to it later).
            Sentry.captureException(backendError);
          }
        }
        setIsPushEnabled(false);
        toast.success("Notifications disabled");
      }
    } catch (e) {
      Sentry.captureException(e);

      // Check if the error was due to denied notification permission
      if (Notification.permission === "denied") {
        toast.error(
          "Notifications blocked. Please enable them in your browser settings.",
        );
      } else {
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        toast.error(`Failed to update notifications: ${errorMessage}`);
      }

      // Revert state if failed
      setIsPushEnabled(!checked);
    } finally {
      setPushLoading(false);
    }
  };

  return (
    <>
      <div className="text-destructive-foreground flex justify-center lg:hidden">
        <p className="absolute top-12 text-xl font-semibold">Notifications</p>
        <button
          type="button"
          aria-label="Back"
          className="absolute top-11 left-10"
          onMouseDown={() => router.back()}
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      </div>
      <main className="flex h-screen flex-col items-center justify-center lg:ml-24">
        <div className="flex h-2/3 w-full flex-col items-center justify-center gap-7 sm:h-1/2">
          <div className="mb-4 w-11/12 lg:w-1/3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="push-notifications"
                checked={isPushEnabled}
                onCheckedChange={(checked) =>
                  handlePushToggle(checked === true)
                }
                disabled={pushLoading}
              />
              <label
                htmlFor="push-notifications"
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Enable Push Notifications
              </label>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
