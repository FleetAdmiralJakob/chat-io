import { z } from "zod";

export const formSchemaSignUp = z.object({
  username: z
    .string()
    .min(7, {
      error: "Username must be at least 7 characters.",
    })
    .max(15, {
      error: "Username must be at most 15 characters.",
    })
    .regex(new RegExp(/^[a-z]+$/), {
      error:
        "Username must be all lowercase. Without numbers or special characters.",
    }),
  usernameId: z
    .string()
    .min(5, {
      error: "The ID for the username must be 5 characters long.",
    })
    .max(5, {
      error: "The ID for the username must be 5 characters long.",
    })
    .refine((val) => !isNaN(Number(val)), {
      error: "The ID for the username must be a number",
    }),
  firstName: z
    .string()
    .min(2, {
      error: "Name must be at least 2 characters.",
    })
    .max(20, {
      error: "Name must be at most 20 characters.",
    })
    .optional(),
  lastName: z
    .string()
    .min(2, {
      error: "Name must be at least 2 characters.",
    })
    .max(20, {
      error: "Name must be at most 20 characters.",
    })
    .optional(),
  email: z.email().optional(),
  password: z
    .string()
    .min(8, {
      error: "Password must be at least 8 characters.",
    })
    .max(20, {
      error: "Password must be at most 20 characters.",
    }),
});

export type FormSchemaSignUp = z.infer<typeof formSchemaSignUp>;

export const formSchemaUserUpdate = z.object({
  firstName: z
    .string()
    .min(2, {
      error: "Name must be at least 2 characters.",
    })
    .max(20, {
      error: "Name must be at most 20 characters.",
    })
    .optional(),
  lastName: z
    .string()
    .min(2, {
      error: "Name must be at least 2 characters.",
    })
    .max(20, {
      error: "Name must be at most 20 characters.",
    })
    .optional(),
  email: z.email().optional(),
});

export type FormSchemaUserUpdate = z.infer<typeof formSchemaUserUpdate>;
