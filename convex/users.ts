import { mutation, query } from "./lib/functions";
import { v } from "convex/values";

export const getUserData = query({
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

    if (args.data.email) {
      await user.patch({
        email: args.data.email,
      });
    }

    if (args.data.lastName) {
      await user.patch({
        lastName: args.data.lastName,
      });
    }

    if (args.data.firstName) {
      await user.patch({
        firstName: args.data.firstName,
      });
    }
  },
});
