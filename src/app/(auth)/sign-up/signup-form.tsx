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
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import React from "react";
import { formSchema } from "~/lib/validators";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function SignUpForm() {
  const [isLoading, setIsLoading] = React.useState(false);

  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const response = await fetch("/api/sign-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    if (response.status === 200) {
      if (!isLoaded) {
        setIsLoading(false);
        // We probably need a toast showing that the user has to try again or use a better way.
        return;
      }
      const result = await signIn.create({
        identifier: values.username + values.usernameId,
        password: values.password,
      });

      if (result.status === "complete") {
        console.log(result);
        await setActive({ session: result.createdSessionId });
        router.push("/");
      }
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
        <span className="text-sm text-muted-foreground">
          This is your display name and the way friends can add you. It consists
          of the username and a ID.
        </span>
        <div className="flex gap-1">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem className="w-1/2">
                <FormControl>
                  <Input
                    placeholder="First Name"
                    type="text"
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
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem className="w-1/2">
                <FormControl>
                  <Input
                    placeholder="Last Name"
                    type="text"
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
        </div>
        <span className="text-sm text-muted-foreground">
          This is optional, so you can stay anonymous.
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
              <FormDescription>
                Password must be at least 8 characters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={isLoading} type="submit" aria-disabled={isLoading}>
          Submit
        </Button>
      </form>
    </Form>
  );
}
