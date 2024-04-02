"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { UserRoundPlus } from "lucide-react";
import { cn } from "~/lib/utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";

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
});

export function AddUserDialog({
  classNameDialogTrigger,
}: {
  classNameDialogTrigger?: string;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      usernameId: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className={cn(
            "inline-flex aspect-square w-10 items-center justify-center rounded-full bg-background",
            classNameDialogTrigger,
          )}
        >
          <UserRoundPlus className="w-full" />
        </button>
      </DialogTrigger>
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
            <DialogFooter>
              <Button type="submit">Add</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
