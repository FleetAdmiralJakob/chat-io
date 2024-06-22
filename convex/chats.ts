import { mutation, query } from "./lib/functions";
import { ConvexError, v } from "convex/values";

export const createChat = mutation({
  args: { friendsUsername: v.string(), friendsUsernameId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }

    const user1 = await ctx
      .table("users")
      .get("username", args.friendsUsername + args.friendsUsernameId);

    const user2 = await ctx
      .table("users")
      .get("clerkId", identity.tokenIdentifier);

    if (!user1) {
      throw new ConvexError(
        "User not found: " + args.friendsUsername + args.friendsUsernameId,
      );
    }

    if (!user2) {
      throw new ConvexError(
        "Mismatch between Clerk and Convex. This is an error by us.",
      );
    } else if (user1.clerkId === identity.tokenIdentifier) {
      throw new ConvexError("Cannot create a chat with yourself.");
    }

    const chatsFromTheUser = await ctx
      .table("users")
      .getX("clerkId", identity.tokenIdentifier)
      .edge("privateChats")
      .map(async (chat) => ({
        ...chat,
        users: await chat.edge("users"),
      }));

    chatsFromTheUser.forEach((chat) => {
      const userIds = chat.users.map((user) => user.clerkId);
      if (userIds.includes(user1.clerkId) && userIds.includes(user2.clerkId)) {
        throw new ConvexError("Chat already created.");
      }
    });

    await ctx
      .table("privateChats")
      .insert({ support: false, users: [user1._id, user2._id] });
  },
});

export const initialConvexSetup = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }

    if (!identity.nickname) {
      console.error(
        "Username is not defined. This is likely an error by us",
        identity,
      );
      throw new ConvexError(
        "Username is not defined. This is likely an error by us.",
      );
    }

    const newUser = await ctx
      .table("users")
      .insert({
        username: identity.nickname,
        clerkId: identity.tokenIdentifier,
        firstName: identity.givenName,
        lastName: identity.familyName,
      })
      .get();

    await ctx
      .table("privateChats")
      .insert({ users: [newUser._id], support: true });

    await ctx
      .table("privateChats")
      .insert({ users: [newUser._id], support: false });
  },
});

export const getChats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }

    return await ctx
      .table("users")
      .getX("clerkId", identity.tokenIdentifier)
      .edge("privateChats")
      .map(async (chat) => {
        const messages = await chat.edge("messages");
        const sortedMessages = messages.sort(
          (a, b) => b._creationTime - a._creationTime,
        );
        const latestMessage = sortedMessages[0];
        const readBy = latestMessage ? await latestMessage.edge("readBy") : [];

        const extendedMessagesPromises = sortedMessages.map(async (message) => {
          return {
            ...message,
            readBy: await message.edge("readBy"),
            deleted: message.deleted,
          };
        });

        const extendedMessages = await Promise.all(extendedMessagesPromises);

        const sortedMessagesAgain = extendedMessages.sort(
          (a, b) => b._creationTime - a._creationTime,
        );

        let deletedCount = 0;
        const firstReadMessageIndex = sortedMessagesAgain.findIndex(
          (message) => {
            if (message.deleted) {
              deletedCount++;
            }
            return (
              message.readBy.some(
                (user) => user.clerkId === identity.tokenIdentifier,
              ) && !message.deleted
            );
          },
        );

        let numberOfUnreadMessages;
        if (firstReadMessageIndex === -1) {
          numberOfUnreadMessages = sortedMessages.length - deletedCount;
        } else {
          numberOfUnreadMessages = firstReadMessageIndex - deletedCount;
        }

        return {
          ...chat,
          users: await chat.edge("users"),
          numberOfUnreadMessages: numberOfUnreadMessages,
          lastMessage: latestMessage
            ? {
                ...latestMessage,
                readBy,
              }
            : null,
        };
      });
  },
});

export const getChatInfoFromId = query({
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

    const chat = await ctx.table("privateChats").get(parsedChatId);

    if (chat === null) {
      throw new ConvexError("did not find chat");
    }

    const usersInChat = await chat.edge("users");

    if (
      !usersInChat.some((user) => user.clerkId === identity.tokenIdentifier)
    ) {
      throw new ConvexError(
        "UNAUTHORIZED REQUEST: User requested chat info from a chat in which he is not in.",
      );
    }

    return {
      basicChatInfo: chat,
      otherUser: usersInChat.filter(
        (user) => user.clerkId !== identity.tokenIdentifier,
      ),
    };
  },
});
