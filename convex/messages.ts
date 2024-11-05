import { ConvexError, v } from "convex/values";
import { mutation, query } from "./lib/functions";

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

    const messages = await chat.edge("messages").map(async (message) => ({
      ...message,
      userId: undefined,
      type: "message" as const,
      from: await ctx.table("users").getX(message.userId),
      readBy: await message.edge("readBy"),
      sent: true,
    }));

    const requests = await chat.edge("clearRequests").map(async (request) => ({
      ...request,
      userId: undefined,
      status: undefined,
      type: `${request.status}Request` as const,
      from: await ctx.table("users").getX(request.userId),
      sent: true,
    }));

    return [...messages, ...requests].sort(
      (a, b) => a._creationTime - b._creationTime,
    );
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

    if (args.content.trim() === "") throw new Error("Message cannot be empty");

    await ctx.table("messages").insert({
      userId: convexUser._id,
      privateChatId: parsedChatId,
      content: args.content.trim(),
      deleted: false,
      readBy: [convexUser._id],
      modified: false,
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

    if ((await message.edge("user")).clerkId !== identity.tokenIdentifier) {
      throw new ConvexError(
        "UNAUTHORIZED REQUEST: User tried to delete a message from another person.",
      );
    }

    const chatId = message.privateChatId;
    const chat = await ctx.table("privateChats").getX(chatId);
    const usersInChat = await chat.edge("users");

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

export const editMessage = mutation({
  args: { messageId: v.id("messages"), newContent: v.string() },
  handler: async (ctx, args) => {
    if (args.newContent.trim() === "")
      throw new Error("Message cannot be empty");

    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }

    const message = await ctx.table("messages").getX(args.messageId);

    if ((await message.edge("user")).clerkId !== identity.tokenIdentifier) {
      throw new ConvexError(
        "UNAUTHORIZED REQUEST: User tried to edit a message from another person.",
      );
    }
    
    if (message.deleted) {
      throw new Error("Cannot edit deleted message");
   }

    await message.patch({
      content: args.newContent.trim(),
      modified: true,
      modifiedAt: Date.now().toString(),
    });
  },
});
