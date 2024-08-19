import { internalMutation, mutation, query } from "./lib/functions";
import { ConvexError, v } from "convex/values";

export const getMessages = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }

    const parsedChatId = ctx.table("privateChats").normalizeId(args.chatId);

    if (!parsedChatId) {
      throw new ConvexError("chatId was invalid");
    }

    const chat = ctx.table("privateChats").getX(parsedChatId);

    const usersInChat = await chat.edge("users");

    if (
      !usersInChat.some((user) => user.clerkId === identity.tokenIdentifier)
    ) {
      throw new ConvexError(
        "UNAUTHORIZED REQUEST: User requested messages from a chat in which he is not in.",
      );
    }

    return chat.edge("messages").map(async (message) => ({
      ...message,
      userId: undefined,
      from: await ctx.table("users").getX(message.userId),
      readBy: await message.edge("readBy"),
      sent: true,
    }));
  },
});

export const createDeleteRequest = mutation({
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
        "UNAUTHORIZED REQUEST: User tried to send a request in a chat in which he is not in.",
      );
    }

    const openRequests = await ctx
      .table("privateChats")
      .get(parsedChatId)
      .edge("messages")
      .filter((q) => q.eq(q.field("type"), "request"));

    if (openRequests && openRequests?.length > 0) {
      throw new ConvexError("There is already at least one open request.");
    }

    await ctx.table("messages").insert({
      userId: convexUser._id,
      privateChatId: parsedChatId,
      content: "",
      type: "openRequest",
      deleted: false,
      readBy: [convexUser._id],
    });
  },
});

export const createMessage = mutation({
  args: { chatId: v.string(), content: v.string() },
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
        "UNAUTHORIZED REQUEST: User tried to send a message in a chat in which he is not in.",
      );
    }

    if (args.content.trim() === "") throw new Error("Post cannot be empty");

    await ctx.table("messages").insert({
      userId: convexUser._id,
      privateChatId: parsedChatId,
      content: args.content.trim(),
      type: "message",
      deleted: false,
      readBy: [convexUser._id],
    });
  },
});

export const deleteAllMessagesInChat = mutation({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }

    const parsedChatId = ctx.table("privateChats").normalizeId(args.chatId);

    if (!parsedChatId) {
      throw new ConvexError("chatId was invalid");
    }

    const usersInChat = await ctx
      .table("privateChats")
      .getX(parsedChatId)
      .edge("users");

    const filteredMessages = await ctx
      .table("messages")
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "request"),
          q.eq(q.field("privateChatId"), args.chatId),
        ),
      );

    const user = await Promise.all(
      filteredMessages.map(async (message) => {
        return await ctx.table("users").getX(message.userId);
      }),
    );

    const userClerkId = user.map((u) => u.clerkId);

    if (
      !usersInChat.some((user) => user.clerkId === identity.tokenIdentifier)
    ) {
      throw new ConvexError(
        "UNAUTHORIZED REQUEST: User tried to send a  in a chat in which he is not in.",
      );
    }

    if (userClerkId.includes(identity.tokenIdentifier)) {
      throw new ConvexError(
        "UNAUTHORIZED REQUEST: User tried to delete all messages in a chat but the user is Unauthenticated.",
      );
    }

    const chat = ctx.table("privateChats").getX(parsedChatId);
    const messagesInChat = await chat.edge("messages");

    for (const message of messagesInChat) {
      await message.delete();
    }
  },
});

export const expireOpenRequests = internalMutation({
  handler: async (ctx) => {
    for (const q1 of await ctx
      .table("messages")
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "request"),
          q.lte(q.field("_creationTime"), Date.now() - 24 * 60 * 60 * 1000),
        ),
      )) {
      await q1.patch({
        type: "expiredRequest",
      });
    }
  },
});

export const rejectRequest = mutation({
  args: { messageId: v.string(), chatId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }

    const parsedMessageId = ctx.table("messages").normalizeId(args.messageId);

    if (!parsedMessageId) {
      throw new ConvexError("chatId was invalid");
    }

    const message = await ctx.table("messages").getX(parsedMessageId);

    await message.patch({
      type: "rejectedRequest",
    });
  },
});

export const deleteMessage = mutation({
  args: { messageId: v.string(), chatId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }

    const parsedMessageId = ctx.table("messages").normalizeId(args.messageId);

    if (!parsedMessageId) {
      throw new ConvexError("chatId was invalid");
    }

    const message = await ctx.table("messages").getX(parsedMessageId);
    const chatId = message.privateChatId;
    const chat = await ctx.table("privateChats").getX(chatId);
    const usersInChat = await chat.edge("users");

    if ((await message.edge("user")).clerkId !== identity.tokenIdentifier) {
      throw new ConvexError(
        "UNAUTHORIZED REQUEST: User tried to delete a message from another person.",
      );
    }

    await message.patch({
      content: "",
      deleted: true,
      readBy: { add: usersInChat.map((user) => user._id) },
    });
  },
});

export const markMessageRead = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      console.error("Unauthenticated call to mutation");
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

    const message = await ctx.table("messages").get(args.messageId);

    if (!message) {
      return null;
    }

    await ctx
      .table("messages")
      .getX(args.messageId)
      .patch({
        readBy: {
          add: [convexUser._id],
        },
      });

    return { success: true };
  },
});
