import { v } from "convex/values";
import { mutation, query } from "./lib/functions";
import { formSchemaUserUpdate } from "./lib/validators";

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

    // Validate data against Zod schema to ensure security
    const parsedData = formSchemaUserUpdate.parse(args.data);

    const user = ctx.table("users").getX("clerkId", identity.tokenIdentifier);

    const updates: { email?: string; lastName?: string; firstName?: string } =
      {};

    // Use parsedData to ensure we only use validated values
    // Note: Zod might transform "" to literal "" or keep it, schema allows both.
    // The logic below checks for truthiness, so empty strings are skipped unless check is stricter.
    // args.data was already partial, parsedData is also partial.

    if (parsedData.email !== undefined && parsedData.email !== "") {
      updates.email = parsedData.email;
    }
    if (parsedData.lastName !== undefined && parsedData.lastName !== "") {
      updates.lastName = parsedData.lastName;
    }
    if (parsedData.firstName !== undefined && parsedData.firstName !== "") {
      updates.firstName = parsedData.firstName;
    }

    // Use one patch instead of a few singular patches for better performance
    await user.patch(updates);
  },
});
