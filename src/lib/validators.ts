import { z } from "zod";

/**
 * Sign Up Form Schema
 *
 * IMPORTANT: Understanding `.optional()` vs `.or(z.literal(""))`:
 *
 * Zod's `.optional()` only allows `undefined` to bypass validation.
 * When a form field has a default value of "" (empty string), `.optional()` alone
 * will NOT work because "" is not `undefined` - it's still a string value that
 * gets validated against `.min()`, `.max()`, etc.
 *
 * Example of the problem:
 * ```
 * z.string().min(2).optional()
 * ```
 * - `undefined` → ✅ passes (optional allows undefined)
 * - `""` → ❌ fails (empty string is validated against min(2))
 * - `"ab"` → ✅ passes
 *
 * Solution: Use `.or(z.literal(""))` to explicitly allow empty strings:
 * ```
 * z.string().min(2).optional().or(z.literal(""))
 * ```
 * - `undefined` → ✅ passes
 * - `""` → ✅ passes (literal "" is allowed)
 * - `"ab"` → ✅ passes
 * - `"a"` → ❌ fails (too short, not empty)
 *
 * This is necessary because React Hook Form initializes fields with "" by default,
 * and HTML inputs always return strings (never undefined).
 */
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
  /**
   * First name is optional - users can stay anonymous.
   *
   * The `.or(z.literal(""))` allows empty strings to pass validation.
   * Without this, an empty string would fail the `.min(2)` check because
   * Zod's `.optional()` only allows `undefined`, not empty strings.
   *
   * Valid values: undefined | "" | string (2-20 chars)
   */
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
  /**
   * Last name is optional - users can stay anonymous.
   * Same pattern as firstName - see comments above.
   *
   * Valid values: undefined | "" | string (2-20 chars)
   */
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
  /**
   * Email is optional - used for password recovery.
   * The `.or(z.literal(""))` allows empty strings since form inputs
   * always return strings, never undefined.
   *
   * Valid values: undefined | "" | valid email string
   */
  email: z
    .email({ error: "Please enter a valid email address." })
    .optional()
    .or(z.literal("")),
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

