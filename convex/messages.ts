import { ConvexError, v } from "convex/values";
import emojiRegex from "emoji-regex";
import { internal } from "./_generated/api";
import { EDIT_WINDOW_MS } from "./constants";
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

    const [messages, requests] = await Promise.all([
      chat.edge("messages").map(async (message) => {
        const [from, readBy, replyTo, reactions] = await Promise.all([
          ctx.table("users").getX(message.userId),
          message.edge("readBy"),
          message.replyTo
            ? ctx
                .table("messages")
                .getX(message.replyTo)
                .then(async (replyToMessage) => {
                  if (replyToMessage) {
                    const replyToUser = await ctx
                      .table("users")
                      .getX(replyToMessage.userId);
                    return {
                      ...replyToMessage,
                      userId: undefined,
                      type: "message" as const,
                      from: replyToUser,
                    };
                  }
                  return null;
                })
            : null,
          message.edge("reactions").docs(),
        ]);

        return {
          ...message,
          userId: undefined,
          type: "message" as const,
          from,
          readBy,
          replyTo,
          reactions,
          sent: true,
        };
      }),
      chat.edge("clearRequests").map(async (request) => ({
        ...request,
        userId: undefined,
        status: undefined,
        type: `${request.status}Request` as const,
        from: await ctx.table("users").getX(request.userId),
        sent: true,
      })),
    ]);

    return [...messages, ...requests].sort(
      (a, b) => a._creationTime - b._creationTime,
    );
  },
});

export const createMessage = mutation({
  args: {
    chatId: v.string(),
    content: v.string(),
    replyToId: v.optional(v.id("messages")),
  },
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

    if (args.replyToId) {
      const replyMessage = await ctx.table("messages").get(args.replyToId);
      if (!replyMessage) {
        throw new ConvexError("Reply message not found");
      }
      if (replyMessage.privateChatId !== parsedChatId) {
        throw new ConvexError("Cannot reply to message from different chat");
      }
      if (replyMessage.deleted) {
        throw new ConvexError("Cannot reply to deleted message");
      }
    }

    await ctx.table("messages").insert({
      userId: convexUser._id,
      privateChatId: parsedChatId,
      content: args.content.trim(),
      deleted: false,
      readBy: [convexUser._id],
      modified: false,
      replyTo: args.replyToId,
      forwarded: 0,
    });

    /**
     * Push Notification Scheduling
     *
     * KNOWN LIMITATION: Race condition with read receipts
     *
     * Notifications are scheduled immediately after message insertion, but the
     * `readBy` array only contains the sender at this point. This creates a race
     * condition where:
     *
     * 1. User A sends a message at time T
     * 2. Push notification is scheduled for User B at time T+0
     * 3. User B reads the message in the UI at time T+0.5s (before notification fires)
     * 4. User B still receives the notification (scheduler runs asynchronously)
     *
     * MITIGATION: The service worker (sw.ts) has suppression logic that checks if
     * the chat is currently open and visible, which handles the most common case.
     * However, this doesn't cover:
     * - Tabs that are not visible
     * - User opening the chat in a different tab/window
     * - General race conditions between read receipts and notification delivery
     *
     * FUTURE ENHANCEMENT: A complete solution would require checking read receipts
     * at notification delivery time (in push.sendPush), but this adds complexity
     * and latency. The current service worker suppression is an acceptable tradeoff.
     *
     * @see src/sw.ts - Service worker notification suppression logic
     */
    const otherUsers = usersInChat.filter((u) => u._id !== convexUser._id);
    const trimmedContent = args.content.trim();

    const pushPromises = otherUsers.map((otherUser) =>
      ctx.scheduler.runAfter(0, internal.push.sendPush, {
        userId: otherUser._id,
        title: convexUser.username,
        body: trimmedContent,
        data: { url: `/chats/${parsedChatId}` },
      }),
    );

    const results = await Promise.allSettled(pushPromises);

    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Failed to schedule push notification:", result.reason);
      }
    }
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
      throw new ConvexError("messageId was invalid");
    }

    const messageReactions = await ctx.table("reactions", "messageId", (q) =>
      q.eq("messageId", parsedMessageId),
    );

    await Promise.all(messageReactions.map((reaction) => reaction.delete()));

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
  args: { messageId: v.union(v.id("messages"), v.id("clearRequests")) },
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

    const messageId = ctx.table("messages").normalizeId(args.messageId);

    if (messageId) {
      const message = await ctx.table("messages").get(messageId);

      if (!message) {
        return null;
      }

      const chat = await ctx.table("privateChats").getX(message.privateChatId);
      const usersInChat = await chat.edge("users");
      if (
        !usersInChat.some((user) => user.clerkId === identity.tokenIdentifier)
      ) {
        throw new ConvexError(
          "User not authorized to mark messages in this chat",
        );
      }

      await message.patch({
        readBy: {
          add: [convexUser._id],
        },
      });
    } else {
      const requestId = ctx.table("clearRequests").normalizeId(args.messageId);

      if (requestId) {
        const request = await ctx.table("clearRequests").get(requestId);

        if (!request) {
          return null;
        }

        const chat = await ctx
          .table("privateChats")
          .getX(request.privateChatId);
        const usersInChat = await chat.edge("users");
        if (
          !usersInChat.some((user) => user.clerkId === identity.tokenIdentifier)
        ) {
          throw new ConvexError(
            "User not authorized to mark messages in this chat",
          );
        }

        await request.patch({
          readBy: {
            add: [convexUser._id],
          },
        });
      } else {
        return { success: false };
      }
    }

    return { success: true };
  },
});

export const forwardMessage = mutation({
  args: {
    forwardObjects: v.array(
      v.object({
        username: v.string(),
        userId: v.string(),
        chatId: v.id("privateChats"),
      }),
    ),

    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }

    for (const forwardObject of args.forwardObjects) {
      const chat = await ctx.table("privateChats").getX(forwardObject.chatId);

      const usersInChat = await chat.edge("users");

      const user = usersInChat.find(
        (user) => user.clerkId === identity.tokenIdentifier,
      );

      if (!user) {
        throw new ConvexError(
          "UNAUTHORIZED REQUEST: User tried to forward a message to a chat in which he is not in.",
        );
      }

      const parsedMessageId = ctx.table("messages").normalizeId(args.messageId);

      if (!parsedMessageId) {
        throw new ConvexError("messageId was invalid");
      }

      const message = await ctx.table("messages").getX(parsedMessageId);

      if (!message) {
        throw new ConvexError("Message does not exist");
      }

      await ctx.table("messages").insert({
        userId: user._id,
        privateChatId: forwardObject.chatId,
        content: message.content,
        deleted: false,
        readBy: [user._id],
        modified: false,
        forwarded: message.forwarded + 1,
      });

      // Schedule push notification for a forwarded message
      const otherUsersInChat = usersInChat.filter((u) => u._id !== user._id);

      for (const otherUser of otherUsersInChat) {
        await ctx.scheduler.runAfter(0, internal.push.sendPush, {
          userId: otherUser._id,
          title: user.username,
          body: message.content,
          data: { url: `/chats/${forwardObject.chatId}` },
        });
      }
    }
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

    if (Date.now() - message._creationTime > EDIT_WINDOW_MS) {
      throw new ConvexError("Cannot edit message older than 15 minutes");
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

export const reactToMessage = mutation({
  args: { messageId: v.id("messages"), reaction: v.string() },
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

    // Check if emoji
    if (
      !emojiRegex().test(args.reaction) ||
      args.reaction.match(emojiRegex())!.length > 1
    ) {
      throw new ConvexError("Reaction must be a single emoji");
    }

    const trimmedReaction = args.reaction.trim();

    // Check if message exists
    const messageId = ctx.table("messages").normalizeId(args.messageId);

    if (!messageId) {
      throw new ConvexError("messageId was invalid");
    }

    // Check if the user already reacted to this message
    const existingReaction = await ctx
      .table("reactions", "messageId", (q) => q.eq("messageId", messageId))
      .filter((q) => q.eq(q.field("userId"), convexUser._id))
      .first();

    if (existingReaction && existingReaction.emoji === trimmedReaction) {
      // Remove the existing reaction
      await existingReaction.delete();
      return null;
    } else if (existingReaction) {
      // Update existing reaction
      await existingReaction.patch({
        emoji: args.reaction,
      });
      return existingReaction;
    }

    // Create a new reaction if none exists
    const reaction = await ctx.table("reactions").insert({
      emoji: trimmedReaction,
      userId: convexUser._id,
      messageId,
    });

    return reaction;
  },
});
