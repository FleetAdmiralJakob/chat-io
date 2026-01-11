"use node";

import { v } from "convex/values";
import webPush from "web-push";
import { internal } from "./_generated/api";
import { type Doc } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";

export const sendPush = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (
      !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
      !process.env.VAPID_PRIVATE_KEY ||
      !process.env.VAPID_EMAIL
    ) {
      const errorMessage =
        "VAPID keys not configured. Push notifications will not be sent.";
      console.error(errorMessage);

      if (process.env.NODE_ENV === "development") {
        throw new Error(errorMessage);
      }
      return;
    }

    webPush.setVapidDetails(
      process.env.VAPID_EMAIL,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );

    const subscriptions: Doc<"pushSubscriptions">[] = await ctx.runQuery(
      internal.notifications.getSubscriptions,
      { userId: args.userId },
    );

    // Truncate the notification body to 500 characters.
    //
    // RATIONALE:
    // 1. Technical Limit (Hard): The Web Push API (RFC 8268) enforces a strict 4096-byte (4KB) limit
    //    on the encrypted payload. Encryption adds ~18 bytes of overhead, leaving ~4078 bytes for
    //    the JSON payload. A 500-character string (even with multibyte characters) plus metadata
    //    is well within this safety margin (~2KB max).
    //
    // 2. Visual Truncation (Soft):
    //    - iOS visually truncates notifications after ~178 characters (4 lines).
    //    - Android visually truncates after ~240 characters (BigText style).
    //
    // 3. User Experience (Expanded View):
    //    Critically, both platforms support an "Expanded View" (long-press or swipe) that displays
    //    significantly more text. Truncating too early (e.g., at 100 chars) breaks this feature,
    //    preventing users from reading longer messages without opening the app.
    //
    //    500 characters is a safe "middle ground" that supports the Expanded View utility while
    //    guaranteeing we never hit the hard 4KB API limit.
    const body =
      args.body.length > 500 ? `${args.body.slice(0, 500)}…` : args.body;

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            JSON.stringify({
              title: args.title,
              body,
              data: args.data as unknown,
            }),
          );
        } catch (error) {
          const isWebPushError = (err: unknown): err is webPush.WebPushError =>
            typeof err === "object" &&
            err !== null &&
            "statusCode" in err &&
            typeof (err as { statusCode: unknown }).statusCode === "number";

          if (isWebPushError(error)) {
            if (error.statusCode === 404 || error.statusCode === 410) {
              // Subscription expired/invalid
              await ctx.runMutation(internal.notifications.deleteSubscription, {
                id: sub._id,
              });
            } else if (error.statusCode === 429) {
              // Rate limited - could implement retry logic here in the future
              console.warn("Rate limited while sending push:", error);
            } else if (error.statusCode >= 500) {
              // Server error
              console.error(
                `Server error sending push (status ${error.statusCode}):`,
                error,
              );
            } else {
              console.error(
                `Failed to send push (status ${error.statusCode}):`,
                error,
              );
            }
          } else {
            console.error("Error sending push:", error);
          }
        }
      }),
    );
  },
});
