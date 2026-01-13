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

    if (parsedData.email !== undefined && parsedData.email !== "") {
      updates.email = parsedData.email;
    }
    if (parsedData.lastName !== undefined && parsedData.lastName !== "") {
      updates.lastName = parsedData.lastName;
    }
    if (parsedData.firstName !== undefined && parsedData.firstName !== "") {
      updates.firstName = parsedData.firstName;
    }

    await user.patch(updates);
  },
});

export const updatePublicKey = mutation({
  args: { publicKey: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx
      .table("users")
      .getX("clerkId", identity.tokenIdentifier);
    await user.patch({ publicKey: args.publicKey });
  },
});
