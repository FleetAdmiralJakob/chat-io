import { z } from "zod";

/**
 * User Update Form Schema
 *
 * NOTE: This schema uses `.or(z.literal(""))` for optional fields to handle
 * React Hook Form's behavior where empty inputs return empty strings instead
 * of undefined.
 *
 * Currently accepts:
 * - `undefined` for omitted fields
 * - `""` (empty string) for cleared fields
 * - Valid string values meeting min/max constraints
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
