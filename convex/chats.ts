import { ConvexError, v } from "convex/values";
import { mutation, query } from "./lib/functions";

export const createChat = mutation({
  args: { friendsUsername: v.string(), friendsUsernameId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }

    const [user1, user2] = await Promise.all([
      ctx
        .table("users")
        .get("username", args.friendsUsername + args.friendsUsernameId),
      ctx.table("users").get("clerkId", identity.tokenIdentifier),
    ]);

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
        // This is safe to do and doesn't need to be hashed/encrypted because Convex already encrypts the data.
        email: identity.email,
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

    return ctx
      .table("users")
      .getX("clerkId", identity.tokenIdentifier)
      .edge("privateChats")
      .map(async (chat) => {
        const [textMessages, requests] = await Promise.all([
          chat.edge("messages").map(async (message) => {
            return {
              ...message,
              readBy: await message.edge("readBy"),
              type: "message" as const,
            };
          }),
          chat.edge("clearRequests").map(async (request) => {
            return {
              ...request,
              type: `${request.status}Request` as const,
              clerkId: (await ctx.table("users").getX(request.userId)).clerkId,
            };
          }),
        ]);

        const allMessages = [...textMessages, ...requests];

        const sortedMessages = allMessages.sort(
          (a, b) => b._creationTime - a._creationTime,
        );
        const latestMessage = sortedMessages[0];

        let deletedCount = 0;
        let firstReadMessageIndex = -1;
        for (let i = 0; i < sortedMessages.length; i++) {
          const message = sortedMessages[i];
          if (!message) continue;

          if (
            (message.type === "message" && message.deleted) ||
            (message.type !== "message" &&
              (await ctx.table("users").getX(message.userId)).clerkId ===
                identity.tokenIdentifier)
          ) {
            deletedCount++;
          }
          const isReadMessage =
            message.type === "message" &&
            message.readBy.some(
              (user) => user.clerkId === identity.tokenIdentifier,
            ) &&
            !message.deleted;
          if (isReadMessage) {
            firstReadMessageIndex = i;
            break;
          }
        }

        const numberOfUnreadMessages =
          firstReadMessageIndex === -1
            ? sortedMessages.length - deletedCount
            : firstReadMessageIndex - deletedCount;

        return {
          ...chat,
          users: await chat.edge("users"),
          numberOfUnreadMessages: numberOfUnreadMessages,
          lastMessage: latestMessage,
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
