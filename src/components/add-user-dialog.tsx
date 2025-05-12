"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { UserRoundPlus } from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";
import { usePostHog } from "posthog-js/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "../../convex/_generated/api";

export const formSchema = z.object({
  username: z
    .string()
    .min(7, {
      message: "Username must be at least 7 characters.",
    })
    .max(15, {
      message: "Username must be at most 20 characters.",
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
});

export function AddUserDialog({
  classNameDialogTrigger,
}: {
  classNameDialogTrigger?: string;
}) {
  const [dialogOpen, setDialogOpen] = useQueryState(
    "dialog",
    parseAsBoolean.withDefault(false)
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      usernameId: "",
    },
  });

  const addChatWithFriend = useMutation(api.chats.createChat);

  const posthog = usePostHog();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await addChatWithFriend({
        friendsUsername: values.username,
        friendsUsernameId: values.usernameId,
      });
      form.reset();
      void setDialogOpen(false);
      posthog.capture("new_connection_added");
    } catch (e) {
      if (e instanceof ConvexError) {
        if (e.message.includes("Cannot create a chat with yourself")) {
          form.setError("usernameId", {
            message: "Cannot create a chat with yourself.",
          });
        } else if (e.message.includes("User not found")) {
          form.setError("usernameId", {
            message: "User not found",
          });
        } else if (e.message.includes("Chat already created")) {
          form.setError("usernameId", {
            message: "Chat already created.",
          });
        }
      }
    }
  }

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={() => setDialogOpen((prevState) => !prevState)}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <button
                className={cn(
                  "inline-flex aspect-square w-11 items-center justify-center rounded-full bg-background",
                  classNameDialogTrigger
                )}
                aria-label="Click here to add a chat with a user"
              >
                <UserRoundPlus className="w-full" />
              </button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add contact</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Add a contact</DialogTitle>
              <DialogDescription>
                Add a user you want to chat with.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="block items-center gap-4">
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="exampleuser"
                        className="col-span-3 mt-1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              .toLowerCase()
                              .replace(" ", "")
                              .substring(0, 15)
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
                  <FormItem className="block items-center gap-4">
                    <FormLabel>Username ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="01010"
                        type="number"
                        className="col-span-3 mt-1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value.replace(/\D/g, "").slice(0, 5)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Add</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
