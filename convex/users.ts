import { query } from "./lib/functions";

export const getUserData = query({
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      return null;
    }

    return ctx.table("users").getX("clerkId", identity.tokenIdentifier);
  },
});
