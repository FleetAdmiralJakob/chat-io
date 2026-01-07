import { v } from "convex/values";
import { internalMutation, internalQuery, mutation } from "./lib/functions";

export const subscribe = mutation({
  args: {
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const user = await ctx.table("users").get("clerkId", identity.subject);
    if (!user) {
      throw new Error("User not found");
    }

    const existing = await ctx
      .table("pushSubscriptions")
      .filter((q) => q.eq(q.field("endpoint"), args.endpoint))
      .first();

    if (existing) {
      if (existing.userId !== user._id) {
        await existing.patch({ userId: user._id, keys: args.keys });
      } else {
        await existing.patch({ keys: args.keys });
      }
      return existing._id;
    }

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
  handler: async (ctx, args) => {
    const existing = await ctx
      .table("pushSubscriptions")
      .filter((q) => q.eq(q.field("endpoint"), args.endpoint))
      .first();

    if (existing) {
      await existing.delete();
    }
  },
});

export const getSubscriptions = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.table("users").get(args.userId);
    if (!user) return [];
    return await user.edge("pushSubscriptions");
  },
});

export const deleteSubscription = internalMutation({
  args: { id: v.id("pushSubscriptions") },
  handler: async (ctx, args) => {
    const sub = await ctx.table("pushSubscriptions").get(args.id);
    if (sub) {
      await sub.delete();
    }
  },
});