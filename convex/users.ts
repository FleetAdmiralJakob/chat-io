import { v } from "convex/values";
import { mutation, query } from "./lib/functions";

export const getUserData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }

    return ctx.table("users").getX("clerkId", identity.tokenIdentifier);
  },
});

export const updateUserData = mutation({
  args: {
    data: v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }

    const user = ctx.table("users").getX("clerkId", identity.tokenIdentifier);

    const updates: { email?: string; lastName?: string; firstName?: string } =
      {};
    if (args.data.email) {
      updates.email = args.data.email;
    }
    if (args.data.lastName) {
      updates.lastName = args.data.lastName;
    }
    if (args.data.firstName) {
      updates.firstName = args.data.firstName;
    }

    // Use one patch instead of a few singular patches for better performance
    await user.patch(updates);
  },
});
