"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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

const formSchema = z.object({
  username: z
    .string()
    .min(7, {
      message: "Username must be at least 7 characters.",
    })
    .max(20, {
      message: "Username must be at most 20 characters.",
    }),
  usernameId: z.number().min(5).max(5),
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
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {}
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
                  <FormLabel required>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="myusername"
                      pattern="[a-zA-Z]*"
                      {...field}
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
                  <FormLabel required>ID</FormLabel>
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
              <FormLabel>Real Name</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
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
              <FormLabel required>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormDescription>
                Password must be at least 8 characters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
