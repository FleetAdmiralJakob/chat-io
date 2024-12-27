import { createClerkClient } from "@clerk/backend";
import { isClerkAPIResponseError } from "@clerk/shared";
import { ActionRetrier } from "@convex-dev/action-retrier";
import { v } from "convex/values";
import {
  formSchemaUserUpdate,
  FormSchemaUserUpdate,
} from "../src/lib/validators";
import { internal } from "./_generated/api";
import { action, internalAction, internalMutation } from "./_generated/server";
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

export const updateUserDataConvex = internalMutation({
  args: {
    data: v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
    identity: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.identity))
      .unique();

    if (user == null) {
      console.error("User not found");
      return null;
    }

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

    await ctx.db.patch(user._id, updates);
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
        password: "test",
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

export const getIdentity = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    return identity?.tokenIdentifier;
  },
});

export const updateUserData = action({
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

    const identity = await ctx.runMutation(internal.users.getIdentity);
    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }
    const userId = identity.split("|")[1];

    if (!parsedSignUpHeaders.success) {
      return console.error("You have to provide valid data");
    } else {
      // Use one patch instead of a few singular patches for better performance

      try {
        const clerkClient = createClerkClient({
          secretKey: process.env.CLERK_SECRET_KEY,
        });

        await clerkClient.users.updateUser(userId, {
          firstName: args.data.firstName,
          lastName: args.data.lastName,
        });

        await ctx.runMutation(internal.users.updateUserDataConvex, {
          identity: identity,
          data: {
            firstName: args.data.firstName,
            lastName: args.data.lastName,
          },
        });

        if (args.data.email) {
          try {
            await clerkClient.emailAddresses.createEmailAddress({
              userId: userId,
              emailAddress: args.data.email,
              verified: true,
              primary: false,
            });

            await ctx.runMutation(internal.users.updateUserDataConvex, {
              identity: identity,
              data: {
                email: args.data.email,
              },
            });

            const userData = await clerkClient.users.getUser(userId);

            if (userData.emailAddresses[1] !== undefined) {
              await clerkClient.emailAddresses.deleteEmailAddress(
                userData.emailAddresses[1].id,
              );
            }
          } catch (e) {
            console.error(e);
            if (isClerkAPIResponseError(e)) {
              if (
                e.errors.some(
                  (error) => error.code === "form_param_format_invalid",
                )
              ) {
                throw new Error("form_param_format_invalid");
              }
              if (
                e.errors.some(
                  (error) => error.code === "form_identifier_exists",
                )
              ) {
                throw new Error("form_identifier_exists");
              }
            }
          }
        }
      } catch (e) {
        if (e instanceof Error) {
          return e.message;
        }
      }
    }
  },
});
