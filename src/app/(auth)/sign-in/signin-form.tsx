"use client";

import { useAuth, useSignIn } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useConvexAuth } from "convex/react";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

/**
 * Sign In Form Schema
 *
 * This form supports two login modes:
 * 1. Email login - user enters their email address
 * 2. Username login - user enters username + usernameId (e.g., "john" + "12345")
 *
 * The `identifier` field uses z.union() to accept either:
 * - A string (email address) when in email login mode
 * - An object { username, usernameId } when in username login mode
 *
 * This creates a discriminated union where the form structure changes
 * based on the login mode selected by the user.
 */
export const formSchema = z.object({
  /**
   * User identifier - can be either email OR username+id combination.
   *
   * z.union() tries each schema in order:
   * 1. First tries z.email() - if the value is a valid email string, it passes
   * 2. If not, tries the object schema with username and usernameId
   *
   * This allows the same form field name to hold different data types
   * depending on the login mode.
   */
  identifier: z.union([
    z.email(),
    z.object({
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
          message: "The ID for the username must be a number",
        }),
    }),
  ]),
  password: z
    .string()
    .min(8, {
      error: "Password must be at least 8 characters.",
    })
    .max(20, {
      error: "Password must be at most 20 characters.",
    }),
});

/**
 * Sign In Form Component
 *
 * This form uses React Hook Form with Zod validation and integrates with:
 * - Clerk for authentication (signIn, setActive, signOut)
 * - Convex for real-time data synchronization (isAuthenticated check)
 *
 * Key Features:
 * - Dual login modes: Email or Username+ID
 * - Form-level (root) errors for server-side validation failures
 * - Field-level errors for client-side validation
 * - Custom JSX error content for complex error messages (e.g., session_exists)
 *
 * Error Handling Strategy:
 * - Root errors (form.setError("root", ...)) are used for:
 *   - session_exists: User is already logged in
 *   - form_identifier_not_found: Email/username doesn't exist
 *   - Generic server errors
 * - Field-specific errors are used for:
 *   - form_password_incorrect: Wrong password (shown on password field)
 *   - Client-side validation errors (handled automatically by Zod)
 */
export function SignInForm() {
  const [formIsLoading, setFormIsLoading] = useState(false);
  const [signInComplete, setSignInComplete] = React.useState(false);
  /** Toggle between email login (true) and username+ID login (false) */
  const [isEmailLogin, setIsEmailLogin] = useState(false);

  const { isLoaded, signIn, setActive } = useSignIn();
  const { signOut } = useAuth();

  const { isAuthenticated } = useConvexAuth();

  /**
   * Custom JSX content for root errors.
   *
   * Some errors need rich content (links, buttons) that can't be expressed
   * as a simple string message. For these cases, we store the JSX separately
   * and display it instead of the plain error message.
   *
   * Example: The "session_exists" error needs a sign-out button and a link
   * to the home page, which can't be done with just an error message string.
   */
  const [rootErrorContent, setRootErrorContent] = useState<ReactNode | null>(
    null,
  );
  const router = useRouter();

  /**
   * Initialize React Hook Form with Zod validation.
   *
   * Default values are set based on the current login mode:
   * - Email mode: identifier is an empty string
   * - Username mode: identifier is an object with empty username and usernameId
   *
   * The password field always starts as an empty string.
   */
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: isEmailLogin
        ? ""
        : {
            username: "",
            usernameId: "",
          },
      password: "",
    },
  });

  /**
   * Reset form when login mode changes.
   *
   * When the user switches between email and username login modes,
   * we need to reset the form to clear any existing values and errors
   * because the `identifier` field structure changes completely.
   *
   * IMPORTANT: The cleanup function clears rootErrorContent.
   * We use the cleanup function (return () => {...}) instead of calling
   * setRootErrorContent directly in the effect body because:
   * - Direct setState calls in effects can cause cascading renders
   * - ESLint rule: react-hooks/set-state-in-effect
   * - The cleanup runs when dependencies change, which is the correct timing
   */
  useEffect(() => {
    form.reset(
      {
        identifier: isEmailLogin
          ? ""
          : {
              username: "",
              usernameId: "",
            },
        password: "",
      },
      {
        keepErrors: false,
      },
    );
    // Clear root error content on cleanup when switching login modes
    return () => {
      setRootErrorContent(null);
    };
  }, [isEmailLogin, form]);

  /**
   * Redirect to /chats after successful sign-in.
   *
   * We wait for both conditions:
   * - signInComplete: Clerk has finished the sign-in process
   * - isAuthenticated: Convex has recognized the authenticated session
   *
   * This ensures the user's session is fully established before navigating.
   */
  useEffect(() => {
    if (signInComplete && isAuthenticated) {
      router.push("/chats");
    }
  }, [isAuthenticated, router, signInComplete]);

  /**
   * Form submission handler.
   *
   * Flow:
   * 1. Set loading state and clear previous errors
   * 2. Check if Clerk is loaded
   * 3. Construct the identifier (email string or username+id concatenation)
   * 4. Call Clerk's signIn.create() with credentials
   * 5. If successful, activate the session and set signInComplete
   * 6. If failed, handle specific Clerk error codes:
   *    - session_exists: Already logged in (root error with custom JSX)
   *    - form_identifier_not_found: User doesn't exist (root error)
   *    - form_password_incorrect: Wrong password (field error on password)
   *    - Other errors: Generic root error
   */
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setFormIsLoading(true);
    setRootErrorContent(null);

    if (!isLoaded) {
      setFormIsLoading(false);
      // TODO: We probably need a toast showing that the user has to try again or use a better way.
      return;
    }

    try {
      /**
       * Construct the identifier for Clerk authentication.
       *
       * If email login: use the string directly (it's already the email)
       * If username login: concatenate username + usernameId to form
       * the full username identifier (e.g., "johnsmith12345")
       */
      const identifier =
        typeof values.identifier === "string"
          ? values.identifier
          : values.identifier.username + values.identifier.usernameId;

      const result = await signIn.create({
        identifier,
        password: values.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setSignInComplete(true);
      }
    } catch (err) {
      /**
       * Handle Clerk API errors.
       *
       * Clerk provides specific error codes that let us show appropriate
       * error messages to the user. We distinguish between:
       * - Root errors: Problems not specific to a single field
       * - Field errors: Problems with a specific input (like wrong password)
       */
      if (isClerkAPIResponseError(err)) {
        if (err.errors.some((err) => err.code === "session_exists")) {
          /**
           * User is already logged in - show custom JSX with action buttons.
           *
           * We set both:
           * - rootErrorContent: The rich JSX to display
           * - form.setError("root"): To trigger the error display logic
           *
           * The message "session_exists" is just a placeholder since we
           * use rootErrorContent for the actual display.
           */
          setRootErrorContent(
            <div>
              You are already signed in. Please{" "}
              <button
                className="cursor-pointer underline"
                onMouseDown={() => signOut()}
              >
                sign out
              </button>{" "}
              before signing in again. Alternatively you can go back to the{" "}
              <Link className="underline" href="/chats">
                home page
              </Link>
              .
            </div>,
          );
          form.setError("root", {
            message: "session_exists",
          });
        } else if (
          err.errors.some((err) => err.code === "form_identifier_not_found")
        ) {
          /**
           * User doesn't exist - show as root error since it's not
           * specifically about the format of the input, but the
           * non-existence of the account.
           */
          form.setError("root", {
            message: `The ${
              isEmailLogin ? "email" : "username + id"
            } you entered does not exist. Please try again.`,
          });
        } else if (
          err.errors.some((err) => err.code === "form_password_incorrect")
        ) {
          /**
           * Wrong password - show as field-specific error on password field.
           *
           * This is a field error (not root) because the problem is
           * specifically with the password input, not the form as a whole.
           */
          form.setError("password", {
            type: "manual",
            message: "The password you entered is incorrect. Please try again.",
          });
        } else {
          form.setError("root", {
            message: "Something went wrong. Please try again.",
          });
        }
      } else {
        form.setError("root", {
          message: "Something went wrong. Please try again.",
        });
      }
    }

    setFormIsLoading(false);
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="bg w-3/4 space-y-8 xl:w-5/12"
    >
      {/* Login mode toggle button */}
      <Button
        type="button"
        variant="outline"
        aria-label={`Switch to ${
          isEmailLogin ? "Username" : "Email"
        } login mode`}
        onClick={() => setIsEmailLogin(!isEmailLogin)}
      >
        Switch to {isEmailLogin ? "Username" : "Email"} Login
      </Button>

      <FieldGroup>
        {/*
         * Conditional rendering based on login mode.
         *
         * Email mode: Single Controller for the entire identifier (string)
         * Username mode: Two Controllers for identifier.username and identifier.usernameId
         *
         * This is necessary because the data structure changes completely
         * between modes (string vs object).
         */}
        {isEmailLogin ? (
          <Controller
            control={form.control}
            name="identifier"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="signin-email">Email</FieldLabel>
                <Input
                  {...field}
                  id="signin-email"
                  type="email"
                  placeholder="example@email.com"
                  aria-invalid={fieldState.invalid}
                  /**
                   * IMPORTANT: Type guard for the value.
                   *
                   * When switching from username mode to email mode, the
                   * field.value might still be the object { username, usernameId }
                   * for a brief moment before the form resets.
                   *
                   * Without this check, the input would display "[object Object]".
                   * We only show the value if it's actually a string.
                   */
                  value={
                    field.value && typeof field.value === "string"
                      ? field.value
                      : ""
                  }
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        ) : (
          <div className="block gap-1 xl:flex">
            <Controller
              control={form.control}
              name="identifier.username"
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="mb-7 w-full xl:m-0 xl:w-2/3"
                >
                  <FieldLabel htmlFor="signin-username">Username</FieldLabel>
                  <Input
                    {...field}
                    id="signin-username"
                    placeholder="exampleuser"
                    maxLength={15}
                    aria-invalid={fieldState.invalid}
                    /**
                     * Transform input to lowercase and remove spaces.
                     *
                     * Usernames are always lowercase without spaces to ensure
                     * consistent matching during authentication.
                     */
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          .toLowerCase()
                          .replace(/\s/g, "")
                          .substring(0, 15),
                      )
                    }
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="identifier.usernameId"
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="w-full xl:w-1/3"
                >
                  <FieldLabel htmlFor="signin-usernameId">
                    Username ID
                  </FieldLabel>
                  <Input
                    {...field}
                    id="signin-usernameId"
                    type="number"
                    placeholder="01010"
                    maxLength={5}
                    aria-invalid={fieldState.invalid}
                    /**
                     * Only allow numeric input, max 5 digits.
                     *
                     * The usernameId is always exactly 5 digits (e.g., "01234").
                     * We strip any non-digit characters and limit to 5 chars.
                     */
                    onChange={(e) =>
                      field.onChange(
                        e.target.value.replace(/\D/g, "").slice(0, 5),
                      )
                    }
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
        )}

        {/* Helper text for username login - hidden when there are errors */}
        {!isEmailLogin && (
          <span
            className={cn("text-secondary-foreground text-sm", {
              hidden: form.formState.errors.identifier,
            })}
          >
            This is your display name and the way friends can add you. It
            consists of the username and a ID.
          </span>
        )}

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              className="xl:w-full xl:flex-2"
            >
              <FieldLabel htmlFor="signin-password">Password</FieldLabel>
              <Input
                {...field}
                id="signin-password"
                placeholder="********"
                type="password"
                maxLength={20}
                aria-invalid={fieldState.invalid}
                onChange={(e) =>
                  field.onChange(e.target.value.substring(0, 20))
                }
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {/*
       * Root error display.
       *
       * form.formState.errors.root contains form-level errors set via
       * form.setError("root", { message: "..." }).
       *
       * If rootErrorContent is set (for rich JSX errors like session_exists),
       * we display that instead of the plain message string.
       *
       * This pattern allows us to show:
       * - Simple string messages for most errors
       * - Rich JSX with buttons/links for complex errors
       */}
      {form.formState.errors.root && (
        <div className="text-destructive text-sm font-medium">
          {rootErrorContent ?? form.formState.errors.root.message}
        </div>
      )}

      <Button
        disabled={formIsLoading}
        type="submit"
        aria-disabled={formIsLoading}
      >
        {formIsLoading ? (
          <>
            <LoaderCircle className="mr-1.5 animate-spin p-0.5" /> Processing...
          </>
        ) : (
          "Submit"
        )}
      </Button>
    </form>
  );
}
