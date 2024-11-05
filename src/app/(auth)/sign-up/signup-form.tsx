"use client";

import { useSignIn } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { cn } from "~/lib/utils";
import { formSchemaSignUp } from "~/lib/validators";
import { useConvexAuth, useMutation } from "convex/react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "../../../../convex/_generated/api";

const signUpResponseSchema = z.object({
  message: z.string(),
  statusText: z.string().optional(),
});

export function SignUpForm() {
  const [formIsLoading, setFormIsLoading] = React.useState(false);
  const [signUpComplete, setSignUpComplete] = React.useState(false);

  const { isLoaded, signIn, setActive } = useSignIn();

  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchemaSignUp>>({
    resolver: zodResolver(formSchemaSignUp),
    defaultValues: {
      username: "",
      usernameId: "",
      password: "",
    },
  });

  const initialConvexSetup = useMutation(api.chats.initialConvexSetup);

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

  async function onSubmit(values: z.infer<typeof formSchemaSignUp>) {
    if (isAuthenticated || isLoading) {
      // TODO: Make a toast or something to tell the user has to sign out first
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

    if (parsedResponseBody.data?.statusText === "username_is_taken") {
      form.setError("username", {
        message: "Username +  ID is already taken. Please choose another.",
      });

      setFormIsLoading(false);
      return;
    }

    if (parsedResponseBody.data?.statusText === "email_is_taken") {
      form.setError("email", {
        message: "Email is already taken. Please choose another.",
      });

      setFormIsLoading(false);
      return;
    }

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
        const result = await signIn.create({
          identifier: values.username + values.usernameId,
          password: values.password,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          setSignUpComplete(true);
          return;
        }
      } catch (_e) {
        console.error("Problem with the sign-in process");
        // TODO: Make a toast that something went wrong
        setFormIsLoading(false);
        return;
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
          This is optional so that you can stay anonymous.
        </span>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-2">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Email" type="text" {...field} />
              </FormControl>
              <FormDescription>
                This is optional, but if you forgot your password, we can send
                you an email.
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
    </Form>
  );
}
