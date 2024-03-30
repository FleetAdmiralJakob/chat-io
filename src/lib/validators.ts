import { z } from "zod";

export const formSchema = z.object({
  username: z
    .string()
    .min(7, {
      message: "Username must be at least 7 characters.",
    })
    .max(20, {
      message: "Username must be at most 20 characters.",
    })
    .regex(new RegExp(/^[a-z]+$/), {
      message: "Username must be all lowercase",
    }),
  usernameId: z
    .string()
    .min(5, {
      message: "The ID for the username must be 5 characters long.",
    })
    .max(5, {
      message: "The ID for the username must be 5 characters long.",
    }),
  firstName: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(20, {
      message: "Name must be at most 20 characters.",
    })
    .optional(),
  lastName: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(20, {
      message: "Name must be at most 20 characters.",
    })
    .optional(),
  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters.",
    })
    .max(20, {
      message: "Password must be at most 20 characters.",
    }),
});

export type FormSchema = z.infer<typeof formSchema>;
