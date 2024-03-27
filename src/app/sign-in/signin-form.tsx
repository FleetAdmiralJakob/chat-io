"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import React from "react";

const formSchema = z.object({
  username: z
    .string()
    .min(7, {
      message: "Username must be at least 7 characters.",
    })
    .max(20, {
      message: "Username must be at most 20 characters.",
    }),
  usernameId: z
    .string()
    .min(5, {
      message: "Username must be 5 characters long.",
    })
    .max(5, {
      message: "Username must be 5 characters long.",
    }),
  name: z.string().min(2).max(20).optional(),
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
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <div className="flex">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="Username*"
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
                <FormItem className="flex-2">
                  <FormControl>
                    <Input type="number" placeholder="01010" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            This is your display name and the way friends can add you. It
            consists of the username and a ID.
          </span>
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex-2">
              <FormControl>
                <Input placeholder={"Full Name*"} type="text" {...field} />
              </FormControl>
              <FormDescription>
                This is optional, so you can stay anonymous.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="flex-2">
              <FormControl>
                <Input placeholder="Password*" type="password" {...field} />
              </FormControl>
              <FormDescription>
                Password must be at least 8 characters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" aria-disabled={isLoading}>
          Submit
        </Button>
      </form>
    </Form>
  );
}
