import { internalMutation } from "./lib/functions";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const sendNotifications = internalMutation({
  args: { messageId: v.id("messages"), chatId: v.id("privateChats") },
  handler: async (ctx, args) => {
    const usersInChat = await ctx
      .table("privateChats")
      .getX(args.chatId)
      .edge("users");

    const message = await ctx.table("messages").getX(args.messageId);

    const notificationPromises = usersInChat.map(async (user) => {
      const subscription = await user.edgeX("notificationSubscription");

      if (user._id !== message.userId) {
        return ctx.scheduler.runAfter(
          0,
          internal.notificationsNode.sendNotification,
          {
            chatId: args.chatId,
            messageContent: message.content,
            senderUsername: user.username,
            subscription: subscription.subscription,
          },
        );
      }
    });

    await Promise.allSettled(notificationPromises);
  },
});
