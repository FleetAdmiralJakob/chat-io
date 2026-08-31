import { ConvexError, v } from "convex/values";
import { mutation } from "./lib/functions";

export const archiveMessage = mutation({
  args: {
    messageId: v.id("messages"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }
    await ctx.table("messages").patch(args.messageId, { archived: true });
    return null;
  },
});

export const unarchiveMessage = mutation({
  args: {
    messageId: v.id("messages"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }
    await ctx.table("messages").patch(args.messageId, { archived: false });
    return null;
  },
});
