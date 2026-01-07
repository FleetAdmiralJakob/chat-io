import { z } from "zod";

/**
 * User Update Form Schema
 *
 * NOTE: This schema does NOT use `.or(z.literal(""))` for optional fields.
 * If this form is used with React Hook Form and empty string defaults,
 * you may need to add the same pattern as formSchemaSignUp.
 *
 * Currently, expects:
 * - `undefined` for empty optional fields (not "")
 * - Or the form should transform "" to undefined before validation
 */
export const formSchemaUserUpdate = z.object({
  firstName: z
    .string()
    .min(2, {
      error: "Name must be at least 2 characters.",
    })
    .max(20, {
      error: "Name must be at most 20 characters.",
    })
    .optional()
    .or(z.literal("")),
  lastName: z
    .string()
    .min(2, {
      error: "Name must be at least 2 characters.",
    })
    .max(20, {
      error: "Name must be at most 20 characters.",
    })
    .optional()
    .or(z.literal("")),
  email: z
    .email({ error: "Please enter a valid email address." })
    .optional()
    .or(z.literal("")),
});

export type FormSchemaUserUpdate = z.infer<typeof formSchemaUserUpdate>;
