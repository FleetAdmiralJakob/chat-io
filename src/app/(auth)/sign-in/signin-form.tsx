"use client";

import { useAuth, useSignIn } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useConvexAuth } from "convex/react";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const formSchema = z.object({
  identifier: z.union([
    z.string().email(),
    z.object({
      username: z
        .string()
        .min(7, {
          message: "Username must be at least 7 characters.",
        })
        .max(15, {
          message: "Username must be at most 15 characters.",
        })
        .regex(new RegExp(/^[a-z]+$/), {
          message:
            "Username must be all lowercase. Without numbers or special characters.",
        }),
      usernameId: z
        .string()
        .min(5, {
          message: "The ID for the username must be 5 characters long.",
        })
        .max(5, {
          message: "The ID for the username must be 5 characters long.",
        })
        .refine((val) => !isNaN(Number(val)), {
          message: "The ID for the username must be a number",
        }),
    }),
  ]),
  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters.",
    })
    .max(20, {
      message: "Password must be at most 20 characters.",
    }),
});

export function SignInForm() {
  const [formIsLoading, setFormIsLoading] = useState(false);
  const [signInComplete, setSignInComplete] = React.useState(false);
  const [isEmailLogin, setIsEmailLogin] = useState(false);

  const { isLoaded, signIn, setActive } = useSignIn();
  const { signOut } = useAuth();

  const { isAuthenticated } = useConvexAuth();

  const [wholeFormError, setWholeFormError] = useState<
    null | string | ReactNode
  >(null);
  const router = useRouter();

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

  // Reset the form to clear it when the user switches between email and username login
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
  }, [isEmailLogin, form]);

  useEffect(() => {
    if (signInComplete && isAuthenticated) {
      router.push("/chats");
    }
  }, [isAuthenticated, router, signInComplete]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setFormIsLoading(true);

    if (!isLoaded) {
      setFormIsLoading(false);
      // TODO: We probably need a toast showing that the user has to try again or use a better way.
      return;
    }

    try {
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
      if (isClerkAPIResponseError(err)) {
        if (err.errors.some((err) => err.code === "session_exists")) {
          setWholeFormError(
            // "You are already signed in. Please sign out before signing in again.",
            <div>
              You are already signed in. Please{" "}
              <button className="underline" onMouseDown={() => signOut()}>
                sign out
              </button>{" "}
              before signing in again. Alternatively you can go back to the{" "}
              <Link className="underline" href="/chats">
                home page
              </Link>
              .
            </div>,
          );
        } else if (
          err.errors.some((err) => err.code === "form_identifier_not_found")
        ) {
          setWholeFormError(
            `The ${
              isEmailLogin ? "email" : "username + id"
            } you entered does not exist. Please try again.`,
          );
        } else if (
          err.errors.some((err) => err.code === "form_password_incorrect")
        ) {
          form.setError("password", {
            type: "manual",
            message: "The password you entered is incorrect. Please try again.",
          });
        } else {
          setWholeFormError("Something went wrong. Please try again.");
        }
      } else {
        setWholeFormError("Something went wrong. Please try again.");
      }
    }

    setFormIsLoading(false);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="bg w-3/4 space-y-8 xl:w-5/12"
      >
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

        {isEmailLogin ? (
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    {...field}
                    // Only show the value if it's actually a string to prevent the input from showing [object Object].
                    value={
                      field.value && typeof field.value === "string"
                        ? field.value
                        : ""
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <div className="block gap-1 xl:flex">
            <FormField
              control={form.control}
              name="identifier.username"
              render={({ field }) => (
                <FormItem className="mb-7 w-full xl:m-0 xl:w-2/3">
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="exampleuser"
                      maxLength={15}
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            .toLowerCase()
                            .replace(/\s/g, "")
                            .substring(0, 15),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="identifier.usernameId"
              render={({ field }) => (
                <FormItem className="w-full xl:w-1/3">
                  <FormLabel>Username ID</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="01010"
                      maxLength={5}
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value.replace(/\D/g, "").slice(0, 5),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="xl:w-full xl:flex-2">
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  placeholder="********"
                  type="password"
                  maxLength={20}
                  {...field}
                  onChange={(e) =>
                    field.onChange(e.target.value.substring(0, 20))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        {wholeFormError && (
          <>
            <br />
            <div className="text-destructive text-sm font-medium">
              {wholeFormError}
            </div>
          </>
        )}
      </form>
    </Form>
  );
}
