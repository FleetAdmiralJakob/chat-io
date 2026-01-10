import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, mutation } from "./lib/functions";

export const subscribe = mutation({
  args: {
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
  },
  returns: v.id("pushSubscriptions"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }
    const user = await ctx
      .table("users")
      .get("clerkId", identity.tokenIdentifier);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Check if this endpoint is already registered
    const existing = await ctx
      .table("pushSubscriptions", "by_endpoint", (q) =>
        q.eq("endpoint", args.endpoint),
      )
      .first();

    if (existing) {
      if (existing.userId !== user._id) {
        // SECURITY NOTE: Different user attempting to use the same endpoint
        // This handles legitimate cases like:
        // - User logged out and different user logged in on the same device
        // - User switched accounts in the same browser
        //
        // The old subscription is deleted to prevent the previous user from
        // receiving notifications intended for the new user. The endpoint
        // will be re-registered below with the new userId.
        //
        // Without this deletion, the old user would continue receiving
        // notifications, and we'd either need to reject this registration
        // (poor UX for account switching) or silently hijack the subscription
        // (security issue - old user loses notifications without knowing why).
        await existing.delete();
      } else {
        // Same user re-subscribing (e.g., page refresh, key rotation)
        // Just update the encryption keys and return the existing subscription
        await existing.patch({ keys: args.keys });
        return existing._id;
      }
    }

    // Create a new subscription for this user + endpoint combination
    return await ctx.table("pushSubscriptions").insert({
      userId: user._id,
      endpoint: args.endpoint,
      keys: args.keys,
    });
  },
});

export const unsubscribe = mutation({
  args: {
    endpoint: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx
      .table("pushSubscriptions", "by_endpoint", (q) =>
        q.eq("endpoint", args.endpoint),
      )
      .first();

    if (existing) {
      await existing.delete();
    }
  },
});

export const getSubscriptions = internalQuery({
  args: { userId: v.id("users") },
  returns: v.array(
    v.object({
      _id: v.id("pushSubscriptions"),
      _creationTime: v.number(),
      userId: v.id("users"),
      endpoint: v.string(),
      keys: v.object({
        p256dh: v.string(),
        auth: v.string(),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await ctx.table("users").get(args.userId);
    if (!user) return [];
    return user.edge("pushSubscriptions");
  },
});

export const deleteSubscription = internalMutation({
  args: { id: v.id("pushSubscriptions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sub = await ctx.table("pushSubscriptions").get(args.id);
    if (sub) {
      await sub.delete();
    }
  },
});
