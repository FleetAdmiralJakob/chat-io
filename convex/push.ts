"use node";

import { v } from "convex/values";
import webPush from "web-push";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";

export const sendPush = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    if (
      !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
      !process.env.VAPID_PRIVATE_KEY ||
      !process.env.VAPID_EMAIL
    ) {
      console.error("VAPID keys not configured");
      return;
    }

    webPush.setVapidDetails(
      process.env.VAPID_EMAIL,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );

    const subscriptions = await ctx.runQuery(
      internal.notifications.getSubscriptions,
      { userId: args.userId },
    );

    await Promise.all(
      subscriptions.map(async (sub: Doc<"pushSubscriptions">) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            JSON.stringify({
              title: args.title,
              body: args.body,
              data: args.data,
            }),
          );
        } catch (error: any) {
          if (error.statusCode === 404 || error.statusCode === 410) {
            // Subscription expired/invalid
            await ctx.runMutation(internal.notifications.deleteSubscription, {
              id: sub._id,
            });
          } else {
            console.error("Error sending push:", error);
          }
        }
      }),
    );
  },
});
