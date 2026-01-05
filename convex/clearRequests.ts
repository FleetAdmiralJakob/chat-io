import { ConvexError, v } from "convex/values";
import { internalMutation, mutation } from "./lib/functions";

export const createClearRequest = mutation({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      console.error("Unauthenticated call to mutation");
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

    const usersInChat = await ctx
      .table("privateChats")
      .getX(parsedChatId)
      .edge("users");

    if (
      !usersInChat.some((user) => user.clerkId === identity.tokenIdentifier)
    ) {
      throw new ConvexError(
        "UNAUTHORIZED REQUEST: User tried to create a request in a chat in which he is not in.",
      );
    }

    const openRequests = await ctx
      .table("privateChats")
      .get(parsedChatId)
      .edge("clearRequests")
      .filter((q) => q.eq(q.field("status"), "pending"));

    if (openRequests && openRequests?.length > 0) {
      throw new ConvexError({
        fullMessage: "There is already at least one open request.",
        errorCode: "ALREADY_OPEN_REQUEST",
      });
    }

    await ctx.table("clearRequests").insert({
      userId: convexUser._id,
      privateChatId: parsedChatId,
      status: "pending",
      readBy: [convexUser._id],
    });
  },
});

export const rejectClearRequest = mutation({
  args: { requestId: v.string(), chatId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }

    const parsedRequestId = ctx
      .table("clearRequests")
      .normalizeId(args.requestId);

    if (!parsedRequestId) {
      throw new ConvexError("chatId was invalid");
    }

    const request = await ctx.table("clearRequests").getX(parsedRequestId);

    const usersInChat = await ctx
      .table("privateChats")
      .getX(request.privateChatId)
      .edge("users");

    if (
      !usersInChat.some((user) => user.clerkId === identity.tokenIdentifier)
    ) {
      throw new ConvexError(
        "UNAUTHORIZED REQUEST: User tried to reject a clear request in a chat in which he is not in.",
      );
    }

    if ((await request.edge("user")).clerkId === identity.tokenIdentifier) {
      throw new ConvexError(
        "UNAUTHORIZED REQUEST: User tried to reject his own clear request.",
      );
    }

    await request.patch({
      status: "rejected",
    });
  },
});

export const acceptClearRequest = mutation({
  args: { requestId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }

    const parsedRequestId = ctx
      .table("clearRequests")
      .normalizeId(args.requestId);

    if (!parsedRequestId) {
      throw new ConvexError("requestId was invalid");
    }

    const request = await ctx.table("clearRequests").getX(parsedRequestId);

    const usersInChat = await ctx
      .table("privateChats")
      .getX(request.privateChatId)
      .edge("users");

    if (
      !usersInChat.some((user) => user.clerkId === identity.tokenIdentifier)
    ) {
      throw new ConvexError(
        "UNAUTHORIZED REQUEST: User tried to accept a clear request in a chat in which he is not in.",
      );
    }

    if ((await request.edge("user")).clerkId === identity.tokenIdentifier) {
      throw new ConvexError(
        "UNAUTHORIZED REQUEST: User tried to accept his own clear request.",
      );
    }

    const chat = ctx.table("privateChats").getX(request.privateChatId);
    const messagesInChat = await chat.edge("messages");
    const requestsInChat = await chat.edge("clearRequests");

    for (const message of messagesInChat) {
      await message.delete();
    }

    for (const request of requestsInChat) {
      await request.delete();
    }
  },
});

export const expirePendingRequests = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const q1 of await ctx
      .table("clearRequests", "by_creation_time", (q) =>
        q.lte("_creationTime", Date.now() - 24 * 60 * 60 * 1000),
      )
      .filter((q) => q.eq(q.field("status"), "pending"))) {
      if (q1) {
        await q1.patch({
          status: "expired",
        });
      }
    }
  },
});
