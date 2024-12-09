import { createClerkClient } from "@clerk/backend";
import { v } from "convex/values";
import {
  formSchemaUserUpdate,
  FormSchemaUserUpdate,
} from "../src/lib/validators";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { mutation, query } from "./lib/functions";

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

export const updateUserDataClerk = internalAction({
  args: {
    data: v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
    identity: v.string(),
  },
  handler: async (_, args) => {
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    const userId = args.identity.split("|")[1];

    if (!userId) {
      throw new Error("Invalid user ID");
    }

    await clerkClient.users.updateUser(userId, {
      firstName: args.data.firstName,
      lastName: args.data.lastName,
    });

    // Todo: Add email update
  },
});

export const updateClerkPassword = internalAction({
  args: {
    password: v.string(),
    identity: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = args.identity.split("|")[1];

    if (!userId) {
      throw new Error("Invalid user ID");
    }

    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    console.log(userId, args.password);

    try {
      await clerkClient.users.updateUser(userId, {
        firstName: "test",
      });
    } catch (e) {
      console.error(e);
    }
  },
});

export const updatePassword = mutation({
  args: {
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }

    await ctx.scheduler.runAfter(0, internal.users.updateClerkPassword, {
      identity: identity.tokenIdentifier,
      password: args.password,
    });
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
    const unparsedSignUpHeaders = args.data satisfies FormSchemaUserUpdate;
    const parsedSignUpHeaders = formSchemaUserUpdate.safeParse(
      unparsedSignUpHeaders,
    );
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }

    await ctx.scheduler.runAfter(0, internal.users.updateUserDataClerk, {
      data: args.data,
      identity: identity.tokenIdentifier,
    });

    if (!parsedSignUpHeaders.success) {
      return console.error("You have to provide valid data");
    } else {
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
      try {
        await user.patch(updates);
      } catch (e) {
        if (e instanceof Error && e.message.includes("email")) {
          throw new Error("Email already in use");
        }
      }
    }
  },
});
