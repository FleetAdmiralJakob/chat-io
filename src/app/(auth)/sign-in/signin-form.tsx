"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import React, { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useConvexAuth } from "convex/react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";

export const formSchema = z.object({
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
  const [, setFormIsLoading] = useState(false);
  const [signInComplete, setSignInComplete] = React.useState(false);

  const { isLoaded, signIn, setActive } = useSignIn();

  const { isLoading, isAuthenticated } = useConvexAuth();

  const [wholeFormError, setWholeFormError] = useState<null | string>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      usernameId: "",
      password: "",
    },
  });

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
      const result = await signIn.create({
        identifier: values.username + values.usernameId,
        password: values.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setSignInComplete(true);
      }
    } catch {
      setWholeFormError(
        "The Username + ID or Password you entered is incorrect. Please try again.",
      );
    }

    setFormIsLoading(false);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="bg w-3/4 space-y-8 xl:w-5/12"
      >
        <div className="block gap-1 xl:flex">
          <FormField
            control={form.control}
            name="username"
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
                          .replace(" ", "")
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
            name="usernameId"
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
        <span
          className={cn("text-sm text-secondary-foreground", {
            hidden:
              form.formState.errors.username ??
              form.formState.errors.usernameId,
          })}
        >
          This is your display name and the way friends can add you. It consists
          of the username and a ID.
        </span>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="xl:flex-2 xl:w-full">
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
        <Button disabled={isLoading} type="submit" aria-disabled={isLoading}>
          {isLoading ? (
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
            <span className="text-sm font-medium text-destructive">
              {wholeFormError}
            </span>
          </>
        )}
      </form>
    </Form>
  );
}
