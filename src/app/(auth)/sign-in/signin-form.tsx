"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import React, { useState } from "react";
import { z } from "zod";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { cn } from "~/lib/utils";

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
  const [isLoading, setIsLoading] = useState(false);
  const { isLoaded, signIn, setActive } = useSignIn();
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    if (!isLoaded) {
      setIsLoading(false);
      // We probably need a toast showing that the user has to try again or use a better way.
      return;
    }

    try {
      const result = await signIn.create({
        identifier: values.username + values.usernameId,
        password: values.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/");
      }
    } catch {
      setWholeFormError(
        "The Username + ID or Password you entered is incorrect. Please try again.",
      );
    }

    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="bg space-y-8">
        <div className="flex gap-1">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem className="w-2/3">
                <FormControl>
                  <Input
                    placeholder="Username"
                    maxLength={20}
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          .toLowerCase()
                          .replace(" ", "")
                          .substring(0, 20),
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
              <FormItem className="w-1/3">
                <FormControl>
                  <Input
                    type="number"
                    placeholder="01010"
                    maxLength={5}
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.slice(0, 5))}
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
            <FormItem className="flex-2">
              <FormControl>
                <Input
                  placeholder="Password"
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
          Submit
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
