import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { UserRoundPlus } from "lucide-react";
import { cn } from "~/lib/utils";

export function AddUserDialog({
  classNameDialogTrigger,
}: {
  classNameDialogTrigger?: string;
}) {
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
        <DialogHeader>
          <DialogTitle>Add a contact</DialogTitle>
          <DialogDescription>
            Add a user you want to chat with.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="block items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Username
            </Label>
            <Input
              id="name"
              placeholder="exampleuser"
              className="col-span-3 mt-1"
            />
          </div>
          <div className="block items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username ID
            </Label>
            <Input
              id="username"
              placeholder="01010"
              className="col-span-3 mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
