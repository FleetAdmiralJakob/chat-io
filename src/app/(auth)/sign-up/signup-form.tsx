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
import React from "react";
import { formSchema } from "~/lib/validators";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { cn } from "~/lib/utils";

export function SignUpForm() {
  const [isLoading, setIsLoading] = React.useState(false);

  const { isLoaded, signIn, setActive } = useSignIn();
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
    const response = await fetch("/api/sign-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    if (response.statusText === "username_is_taken") {
      form.setError("username", {
        message: "Username +  ID is already taken. Please choose another.",
      });

      setIsLoading(false);
      return;
    }

    if (response.statusText === "form_password_pwned") {
      form.setError("password", {
        message:
          "Password is insecure or has been found in an online data breach. For account safety, please use a different password.",
      });

      setIsLoading(false);
      return;
    }

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
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="bg w-3/4 space-y-8 xl:w-5/12"
      >
        <div className="block gap-1 xl:flex">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem className="mb-7 w-full xl:mb-0 xl:w-2/3">
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="exampleuser"
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
        <div className="block gap-1 xl:flex">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem className="xl:1/3 w-full xl:w-1/2">
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John"
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
              <FormItem className="w-full xl:w-1/2">
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Doe"
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
        <span
          className={cn("text-sm text-secondary-foreground", {
            hidden:
              form.formState.errors.firstName ?? form.formState.errors.lastName,
          })}
        >
          This is optional, so you can stay anonymous.
        </span>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="flex-2">
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
