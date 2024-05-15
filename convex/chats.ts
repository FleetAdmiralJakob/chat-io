import { mutation, query } from "./lib/functions";
import { ConvexError, v } from "convex/values";

export const createChat = mutation({
  args: { friendsUsername: v.string(), friendsUsernameId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new ConvexError("Unauthenticated call to mutation");
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

    console.log(user2);

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
      .edge("chats")
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
      throw new ConvexError("Unauthenticated call to mutation");
    }

    if (!identity.nickname) {
      console.log(identity);
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
      return null;
    }

    return await ctx
      .table("users")
      .getX("clerkId", identity.tokenIdentifier)
      .edge("chats")
      .map(async (chat) => ({
        ...chat,
        users: await chat.edge("users"),
      }));
  },
});
