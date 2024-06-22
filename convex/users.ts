import { query } from "./lib/functions";
import { ConvexError } from "convex/values";

export const getUserData = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new ConvexError("Unauthenticated call to mutation");
    }

    return ctx.table("users").getX("clerkId", identity.tokenIdentifier);
  },
});
