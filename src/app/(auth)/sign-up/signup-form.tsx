"use client";

import { SignOutButton, useSignIn, useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/login-dialog";
import { Button } from "~/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { formSchemaSignUp } from "~/lib/validators";
import { useConvexAuth, useMutation } from "convex/react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "../../../../convex/_generated/api";

/**
 * Response schema for the sign-up API endpoint.
 *
 * The API returns a message and an optional statusText that indicates
 * specific error conditions that need special handling in the UI.
 */
const signUpResponseSchema = z.object({
  message: z.string(),
  /**
   * Error status codes returned by the API:
   * - "username_is_taken": Username + ID combination already exists
   * - "email_is_taken": Email address is already registered
   * - "form_password_pwned": Password found in data breach (Have I Been Pwned)
   */
  statusText: z.string().optional(),
});

/**
 * Sign Up Form Component
 *
 * This form handles new user registration with the following flow:
 * 1. User fills in registration details (username, usernameId, optional name/email, password)
 * 2. Form is validated client-side using Zod schema
 * 3. Data is sent to /api/sign-up for server-side processing and Clerk user creation
 * 4. If successful, user is automatically signed in via Clerk
 * 5. Convex is initialized for the new user
 * 6. User is redirected to /chats
 *
 * Key Features:
 * - Form-level (root) errors for server-side validation failures
 * - Field-level errors for client-side validation and password security issues
 * - Optional fields (firstName, lastName, email) for user anonymity
 * - Dialog handling for users who are already logged in
 *
 * Error Handling Strategy:
 * - Root errors (form.setError("root", ...)) are used for:
 *   - username_is_taken: Username + ID already exists
 *   - email_is_taken: Email already registered
 *   - Generic server errors
 * - Field-specific errors are used for:
 *   - form_password_pwned: Password found in breach (shown on password field)
 *   - Client-side validation errors (handled automatically by Zod)
 *
 * Integration Points:
 * - Clerk: User creation and authentication
 * - Convex: Real-time database initialization (initialConvexSetup mutation)
 * - /api/sign-up: Server-side user registration endpoint
 */
export function SignUpForm() {
  const [formIsLoading, setFormIsLoading] = React.useState(false);
  const [signUpComplete, setSignUpComplete] = React.useState(false);
  const [loadingSignOut, setLoadingSignOut] = React.useState(false);
  /** Controls the "already signed in" dialog visibility */
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const clerkUser = useUser();

  const { isLoaded, signIn, setActive } = useSignIn();

  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();

  /**
   * Initialize React Hook Form with Zod validation.
   *
   * IMPORTANT: Default values must be set for ALL fields, including optional ones.
   *
   * We use empty strings ("") as defaults for optional fields (firstName, lastName, email).
   * This works with our Zod schema because we use `.or(z.literal(""))` to explicitly
   * allow empty strings. See validators.ts for detailed explanation.
   *
   * Without this pattern:
   * - z.string().min(2).optional() would FAIL for "" (empty string)
   * - Because .optional() only allows undefined, not ""
   * - But HTML inputs return "" (empty string), never undefined
   *
   * @see ~/lib/validators.ts for the Zod schema with detailed comments
   */
  const form = useForm<z.infer<typeof formSchemaSignUp>>({
    resolver: zodResolver(formSchemaSignUp),
    defaultValues: {
      username: "",
      usernameId: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  /**
   * Convex mutation to initialize the new user's data.
   *
   * After successful Clerk authentication, we need to set up the user's
   * record in Convex. This mutation creates the initial data structure
   * for the user (chats, settings, etc.).
   */
  const initialConvexSetup = useMutation(api.chats.initialConvexSetup);

  /**
   * Initialize Convex and redirect after successful sign-up.
   *
   * This effect runs when:
   * 1. signUpComplete is true (Clerk sign-up and sign-in finished)
   * 2. isAuthenticated is true (Convex recognizes the session)
   *
   * Flow:
   * 1. Call initialConvexSetup to create user data in Convex
   * 2. If successful, redirect to /chats
   * 3. If failed, silently ignore (user can retry later)
   *
   * We wait for both conditions to ensure the session is fully established
   * before making the Convex mutation.
   */
  useEffect(() => {
    if (signUpComplete && isAuthenticated) {
      initialConvexSetup().then(
        () => {
          router.push("/chats");
        },
        () => {
          return undefined;
        },
      );
    }
  }, [initialConvexSetup, isAuthenticated, router, signUpComplete]);

  /**
   * Form submission handler.
   *
   * Flow:
   * 1. Check if user is already authenticated - show dialog if so
   * 2. Send registration data to /api/sign-up endpoint
   * 3. Parse response and handle specific error codes:
   *    - username_is_taken: Show root error
   *    - email_is_taken: Show root error
   *    - form_password_pwned: Show field error on password
   * 4. If successful, sign in the new user via Clerk
   * 5. Set signUpComplete to trigger Convex initialization
   *
   * Server-side validation catches issues that can't be validated client-side:
   * - Username uniqueness (requires database check)
   * - Email uniqueness (requires database check)
   * - Password security (requires Have I Been Pwned API)
   */
  async function onSubmit(values: z.infer<typeof formSchemaSignUp>) {
    /**
     * Prevent registration if user is already authenticated.
     *
     * Instead of showing an error, we show a dialog with options to:
     * 1. Sign out and proceed with registration
     * 2. Continue to the app with existing account
     */
    if (isAuthenticated || isLoading) {
      setDialogOpen(true);
      return;
    }
    setFormIsLoading(true);
    const response = await fetch("/api/sign-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const parsedResponseBody = signUpResponseSchema.safeParse(
      await response.json(),
    );

    /**
     * Handle username already taken error.
     *
     * This is a root error because it's about the combination of
     * username + usernameId, not a format issue with either field.
     */
    if (parsedResponseBody.data?.statusText === "username_is_taken") {
      form.setError("root", {
        message: "Username + ID has already been taken. Please choose another.",
      });

      setFormIsLoading(false);
      return;
    }

    /**
     * Handle email already taken error.
     *
     * This is a root error because users might want to sign in instead,
     * and the error message includes that suggestion.
     */
    if (parsedResponseBody.data?.statusText === "email_is_taken") {
      form.setError("root", {
        message:
          "Email is already taken. Please choose another. If you already have an account, please sign in.",
      });

      setFormIsLoading(false);
      return;
    }

    /**
     * Handle password found in data breach.
     *
     * This is a field-specific error (on password field) because
     * the problem is specifically with the password they entered.
     * The user needs to choose a different password.
     *
     * Uses Have I Been Pwned API server-side to check if password
     * has been exposed in known data breaches.
     */
    if (parsedResponseBody.data?.statusText === "form_password_pwned") {
      form.setError("password", {
        message:
          "Password is insecure or has been found in an online data breach. For account safety, please use a different password.",
      });

      setFormIsLoading(false);
      return;
    }

    if (response.status === 200) {
      if (!isLoaded) {
        setFormIsLoading(false);
        // TODO: We probably need a toast showing that the user has to try again or use a better way.
        return;
      }
      try {
        /**
         * After successful registration, automatically sign in the user.
         *
         * We use the same identifier format as the sign-in form:
         * username + usernameId concatenated (e.g., "johnsmith12345")
         */
        const result = await signIn.create({
          identifier: values.username + values.usernameId,
          password: values.password,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          setSignUpComplete(true);
          return;
        }
      } catch {
        console.error("Problem with the sign-in process");
        form.setError("root", {
          message: "Something went wrong during sign-in. Please try again.",
        });
        setFormIsLoading(false);
        return;
      }
    } else {
      form.setError("root", {
        message: "Something went wrong. Please try again.",
      });
    }
    setFormIsLoading(false);
  }

  return (
    <>
      {/*
       * "Already signed in" dialog.
       *
       * Shown when a user tries to sign up while already authenticated.
       * Offers two options:
       * 1. Sign out and continue with registration
       * 2. Go to /chats with existing account
       *
       * This prevents confusion from having multiple accounts or
       * accidentally creating duplicate accounts.
       */}
      <AlertDialog
        open={dialogOpen}
        onOpenChange={() => {
          setDialogOpen(!dialogOpen);
        }}
      >
        {!loadingSignOut ? (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                You are already signed in as {clerkUser.user?.username}.
              </AlertDialogTitle>
              <AlertDialogDescription>
                Do you want to sign out or be forwarded?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <SignOutButton>
                <Button
                  onClick={() => {
                    setLoadingSignOut(true);
                  }}
                >
                  Sign Out
                </Button>
              </SignOutButton>
              <Button
                className="mb-3 sm:w-44 lg:mb-0"
                onClick={() => {
                  router.push("/chats");
                }}
              >
                <p className="w-48 truncate">
                  Continue as {clerkUser.user?.username}
                </p>
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        ) : dialogOpen ? (
          <AlertDialogContent>
            <div className="flex">
              <LoaderCircle className="mr-1.5 animate-spin p-0.5" />
              <span className="mt-0.5 text-sm">Signing out...</span>
            </div>
          </AlertDialogContent>
        ) : null}
      </AlertDialog>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="bg w-3/4 space-y-8 xl:w-5/12"
      >
        <FieldGroup>
          {/* Username and Username ID fields */}
          <div className="block gap-1 xl:flex">
            <Controller
              control={form.control}
              name="username"
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="mb-7 w-full xl:mb-0 xl:w-2/3"
                >
                  <FieldLabel htmlFor="signup-username">Username</FieldLabel>
                  <Input
                    {...field}
                    id="signup-username"
                    placeholder="exampleuser"
                    maxLength={15}
                    aria-invalid={fieldState.invalid}
                    /**
                     * Transform input to lowercase, remove spaces.
                     *
                     * Usernames must be all lowercase letters only.
                     * The regex validation in Zod will catch any non-letter chars.
                     */
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          .toLowerCase()
                          .replace(" ", "")
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
              name="usernameId"
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="w-full xl:w-1/3"
                >
                  <FieldLabel htmlFor="signup-usernameId">
                    Username ID
                  </FieldLabel>
                  <Input
                    {...field}
                    id="signup-usernameId"
                    type="number"
                    placeholder="01010"
                    maxLength={5}
                    aria-invalid={fieldState.invalid}
                    /**
                     * Only allow numeric input, exactly 5 digits.
                     *
                     * The usernameId distinguishes users with the same username.
                     * Format: 5 digits, e.g., "01234", "99999"
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

          {/* Helper text for username - hidden when there are errors */}
          <span
            className={cn("text-secondary-foreground text-sm", {
              hidden:
                form.formState.errors.username ??
                form.formState.errors.usernameId,
            })}
          >
            This is your display name and the way friends can add you. It
            consists of the username and an ID.
          </span>

          {/*
           * Optional name fields.
           *
           * These fields are optional - users can stay anonymous.
           * The Zod schema uses .or(z.literal("")) to allow empty strings.
           * @see ~/lib/validators.ts for detailed explanation of this pattern.
           */}
          <div className="block gap-1 xl:flex">
            <Controller
              control={form.control}
              name="firstName"
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="mb-7 w-full xl:mb-0 xl:w-1/2"
                >
                  <FieldLabel htmlFor="signup-firstName">First Name</FieldLabel>
                  <Input
                    {...field}
                    id="signup-firstName"
                    placeholder="John"
                    type="text"
                    maxLength={20}
                    aria-invalid={fieldState.invalid}
                    onChange={(e) =>
                      field.onChange(e.target.value.substring(0, 20))
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
              name="lastName"
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="w-full xl:w-1/2"
                >
                  <FieldLabel htmlFor="signup-lastName">Last Name</FieldLabel>
                  <Input
                    {...field}
                    id="signup-lastName"
                    placeholder="Doe"
                    type="text"
                    maxLength={20}
                    aria-invalid={fieldState.invalid}
                    onChange={(e) =>
                      field.onChange(e.target.value.substring(0, 20))
                    }
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          {/* Helper text for optional name fields */}
          <span
            className={cn("text-secondary-foreground text-sm", {
              hidden:
                form.formState.errors.firstName ??
                form.formState.errors.lastName,
            })}
          >
            This is optional so that you can stay anonymous.
          </span>

          {/*
           * Optional email field.
           *
           * Used for password recovery. Also uses .or(z.literal(""))
           * to allow empty strings.
           */}
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="flex-2">
                <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                <Input
                  {...field}
                  id="signup-email"
                  placeholder="Email"
                  type="text"
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>
                  This is optional, but if you forgot your password, we can send
                  you an email.
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="flex-2">
                <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                <Input
                  {...field}
                  id="signup-password"
                  placeholder="********"
                  type="password"
                  maxLength={20}
                  aria-invalid={fieldState.invalid}
                  onChange={(e) =>
                    field.onChange(e.target.value.substring(0, 20))
                  }
                />
                <FieldDescription>
                  Password must be at least 8 characters.
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
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
         * Used for errors that aren't specific to a single field:
         * - username_is_taken: The username+ID combination exists
         * - email_is_taken: Email is already registered
         * - Generic server errors
         *
         * Unlike the sign-in form, we don't need custom JSX content here
         * because all errors can be expressed as simple strings.
         */}
        {form.formState.errors.root && (
          <div className="text-destructive text-sm font-medium">
            {form.formState.errors.root.message}
          </div>
        )}

        <Button
          disabled={formIsLoading}
          type="submit"
          aria-disabled={formIsLoading}
        >
          {formIsLoading ? (
            <>
              <LoaderCircle className="mr-1.5 animate-spin p-0.5" />{" "}
              Processing...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </form>
    </>
  );
}
