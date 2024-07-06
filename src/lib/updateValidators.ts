import { z } from "zod";

export const formSchemaUpdate = z.object({
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
  email: z.string().email().optional(),
});

export type FormSchemaUpdate = z.infer<typeof formSchemaUpdate>;
