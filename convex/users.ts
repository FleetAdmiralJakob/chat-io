import { query } from "./lib/functions";

export const getUserData = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      console.error("Unauthenticated call to query getUserData");
      return null;
    }

    return ctx.table("users").getX("clerkId", identity.tokenIdentifier);
  },
});
