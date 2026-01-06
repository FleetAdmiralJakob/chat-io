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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
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
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "../../convex/_generated/api";

export const formSchema = z.object({
  username: z
    .string()
    .min(7, {
      error: "Username must be at least 7 characters.",
    })
    .max(15, {
      error: "Username must be at most 15 characters.",
    })
    .regex(new RegExp(/^[a-z]+$/), {
      error:
        "Username must be all lowercase. Without numbers or special characters.",
    }),
  usernameId: z
    .string()
    .min(5, {
      error: "The ID for the username must be 5 characters long.",
    })
    .max(5, {
      error: "The ID for the username must be 5 characters long.",
    })
    .refine((val) => !isNaN(Number(val)), {
      error: "The ID for the username must be a number",
    }),
});

export function AddUserDialog({
  classNameDialogTrigger,
}: {
  classNameDialogTrigger?: string;
}) {
  const [dialogOpen, setDialogOpen] = useQueryState(
    "dialog",
    parseAsBoolean.withDefault(false),
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
      toast.success("Contact added successfully!");
      form.reset();
      void setDialogOpen(false);
      posthog.capture("new_connection_added");
    } catch (e) {
      if (e instanceof ConvexError) {
        if (e.message.includes("Cannot create a chat with yourself")) {
          form.setError("root", {
            message: "Cannot create a chat with yourself.",
          });
        } else if (e.message.includes("User not found")) {
          form.setError("root", {
            message: "User not found. Please check the username and ID.",
          });
        } else if (e.message.includes("Chat already created")) {
          form.setError("root", {
            message: "Chat already created.",
          });
        } else {
          form.setError("root", {
            message: "An unexpected error occurred.",
          });
        }
      } else {
        form.setError("root", {
          message: "Failed to add contact. Please try again.",
        });
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
                  "bg-background inline-flex aspect-square w-11 cursor-pointer items-center justify-center rounded-full",
                  classNameDialogTrigger,
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
      <DialogContent className="sm:max-w-md">
        <form
          className="flex flex-col gap-4"
          id="form-add-user-dialog"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <DialogHeader>
            <DialogTitle>Add a contact</DialogTitle>
            <DialogDescription>
              Add a user you want to chat with.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Controller
              control={form.control}
              name="username"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-add-user-dialog-username">
                    Username
                  </FieldLabel>
                  <Input
                    {...field}
                    placeholder="exampleuser"
                    id="form-add-user-dialog-username"
                    aria-invalid={fieldState.invalid}
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
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-add-user-dialog-usernameId">
                    Username ID
                  </FieldLabel>
                  <Input
                    {...field}
                    placeholder="01010"
                    id="form-add-user-dialog-usernameId"
                    type="number"
                    aria-invalid={fieldState.invalid}
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
          </FieldGroup>
          {form.formState.errors.root && (
            <p className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </p>
          )}
          <DialogFooter>
            <Button form="form-add-user-dialog" type="submit">
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
