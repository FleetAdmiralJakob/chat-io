import { mutation } from "./lib/functions";
import { ConvexError, v } from "convex/values";
import { subscription } from "./schema";

export const saveSubscription = mutation({
  args: {
    subscription: subscription,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      return null;
    }

    const convexUser = await ctx
      .table("users")
      .get("clerkId", identity.tokenIdentifier);

    if (!convexUser) {
      throw new ConvexError(
        "Mismatch between Clerk and Convex. This is an error by us.",
      );
    }

    const userSubscription = await convexUser.edge("notificationSubscription");

    if (userSubscription) {
      await convexUser.delete();
    }

    return ctx.table("notificationSubscriptions").insert({
      subscription: args.subscription,
      userId: convexUser._id,
    });
  },
});

export const deleteSubscription = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      return null;
    }

    const convexUser = await ctx
      .table("users")
      .get("clerkId", identity.tokenIdentifier);

    if (!convexUser) {
      throw new ConvexError(
        "Mismatch between Clerk and Convex. This is an error by us.",
      );
    }

    const userSubscription = await convexUser.edge("notificationSubscription");

    if (userSubscription) {
      return await convexUser.delete();
    }
  },
});
