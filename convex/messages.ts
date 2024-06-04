import { mutation, query } from "./lib/functions";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";

export const getMessages = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    const parsedChatId = ctx.table("privateChats").normalizeId(args.chatId);

    if (!parsedChatId) {
      throw new ConvexError("chatId was invalid");
    }

    return ctx
      .table("privateChats")
      .getX(parsedChatId)
      .edge("messages")
      .map(async (message) => ({
        ...message,
        userId: undefined,
        from: await ctx.table("users").getX(message.userId),
        readBy: await message.edge("readBy"),
      }));
  },
});

export const createMessage = mutation({
  args: { chatId: v.string(), content: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      return null;
    }

    const convexUser = await ctx
      .table("users")
      .get("clerkId", identity.tokenIdentifier);

    const parsedChatId = ctx.table("privateChats").normalizeId(args.chatId);

    if (!parsedChatId) {
      throw new ConvexError("chatId was invalid");
    }

    if (!convexUser) {
      throw new ConvexError(
        "Mismatch between Clerk and Convex. This is an error by us.",
      );
    }

    if (args.content.trim() === "") throw new Error("Post cannot be empty");

    const messageId = await ctx.table("messages").insert({
      userId: convexUser._id,
      privateChatId: parsedChatId,
      content: args.content.trim(),
      deleted: false,
    });

    await ctx.scheduler.runAt(
      0,
      internal.notificationsConvex.sendNotifications,
      {
        messageId,
        chatId: parsedChatId,
      },
    );
  },
});

export const deleteMessage = mutation({
  args: { messageId: v.string() },
  handler: async (ctx, args) => {
    const parsedMessageId = ctx.table("messages").normalizeId(args.messageId);

    if (!parsedMessageId) {
      throw new ConvexError("chatId was invalid");
    }

    await (
      await ctx.table("messages").getX(parsedMessageId)
    ).patch({
      content: "",
      deleted: true,
    });
  },
});

export const markMessageRead = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      return null;
    }

    const convexUser = await ctx
      .table("users")
      .get("clerkId", identity.tokenIdentifier);

    if (!convexUser?._id) {
      throw new ConvexError(
        "Mismatch between Clerk and Convex. This is an error by us.",
      );
    }

    await ctx
      .table("messages")
      .getX(args.messageId)
      .patch({
        readBy: {
          add: [convexUser._id],
        },
      });
  },
});
