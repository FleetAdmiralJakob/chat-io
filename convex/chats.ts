import { mutation } from "./functions";
import { v } from "convex/values";
import { clerkClient } from "@clerk/clerk-sdk-node";

export const createChat = mutation({
  args: { friendsUsername: v.string(), friendsUsernameId: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Unauthenticated call to mutation");
    }

    const user = await clerkClient.users.getUserList({
      username: [args.friendsUsername + args.friendsUsernameId],
      limit: 1,
    });

    if (!user?.[0]) {
      throw new Error("User not found");
    }

    await ctx
      .table("privateChats")
      .insert({ memberIds: [identity.tokenIdentifier, user[0].id] });
  },
});
