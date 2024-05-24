import { mutation, query } from "./lib/functions";
import { ConvexError, v } from "convex/values";

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
      .map(async (chat) => ({
        ...chat,
        userId: undefined,
        from: await ctx.table("users").getX(chat.userId),
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

    await ctx.table("messages").insert({
      userId: convexUser._id,
      privateChatId: parsedChatId,
      content: args.content.trim(),
    });
  },
});
