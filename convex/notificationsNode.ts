"use node";

import webPush from "web-push";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { subscription } from "./schema";

export const sendNotification = internalAction({
  args: {
    senderUsername: v.string(),
    messageContent: v.string(),
    chatId: v.id("privateChats"),
    subscription: subscription,
  },
  handler: async (_, args) => {
    if (
      !process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ||
      !process.env.WEB_PUSH_EMAIL ||
      !process.env.WEB_PUSH_PRIVATE_KEY
    ) {
      throw new Error("Environment variables supplied not sufficient.");
    }

    try {
      webPush.setVapidDetails(
        `mailto:${process.env.WEB_PUSH_EMAIL}`,
        process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
        process.env.WEB_PUSH_PRIVATE_KEY,
      );

      const notificationPayload = JSON.stringify({
        title: args.senderUsername,
        message: args.messageContent,
        chatId: args.chatId,
      });

      await webPush.sendNotification(
        {
          endpoint: args.subscription.endpoint,
          keys: {
            auth: args.subscription.auth,
            p256dh: args.subscription.p256dh,
          },
        },
        notificationPayload,
      );
    } catch (err) {
      console.error("Error sending notification", err);
    }
  },
});
