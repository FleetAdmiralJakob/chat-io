"use client";

import {
  arrayBufferToBase64String,
  base64StringToUint8Array,
} from "~/lib/utils";
import { useEffect } from "react";
import { registration$, subscription$ } from "~/states";
import { useMutation as useConvexMutation } from "convex/react";
import { useMutation as useRqMutation } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import { observer } from "@legendapp/state/react";

const usePushNotificationSubscription = () => {
  const subscribe = useConvexMutation(api.subscriptions.saveSubscription);

  const mutation = useRqMutation({
    mutationFn: async () => {
      if (!process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY) {
        throw new Error("Environment variables supplied not sufficient.");
      }
      if (!registration$.get()) {
        console.error("No SW registration available.");
        return;
      }

      try {
        const sub = await registration$.get()!.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64StringToUint8Array(
            process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
          ),
        });

        if (sub.getKey("p256dh") && sub.getKey("auth")) {
          await subscribe({
            subscription: {
              endpoint: sub.endpoint,
              expirationTime: sub.expirationTime ?? undefined,
              p256dh: arrayBufferToBase64String(sub.getKey("p256dh")!),
              auth: arrayBufferToBase64String(sub.getKey("auth")!),
            },
          });
        } else {
          console.error("Key p256dh or auth is null");
        }

        console.log("sub", sub);
      } catch (error) {
        console.error("Error subscribing to push notifications:", error);
      }
    },
  });

  useEffect(() => {
    mutation.mutate();
  }, []);

  return mutation;
};

export const PushSubscriptionManager = observer(() => {
  const subscribe = usePushNotificationSubscription();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.serwist !== undefined
    ) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (
            sub &&
            !(
              sub.expirationTime &&
              Date.now() > sub.expirationTime - 5 * 60 * 1000
            )
          ) {
            subscription$.set(sub);
          }
        });
        registration$.set(reg);
      });

      subscribe.mutate();
    }
  }, []);

  return null;
});
