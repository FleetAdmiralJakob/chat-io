import { Chats } from "~/components/chat-overview";
import { UserInfos } from "~/components/message";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import { useMutation } from "convex/react";
import { Forward } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";

interface ForwardDialogProps {
  ForwardedMessageId: string;
  setForwardedMessageId: Dispatch<SetStateAction<string>>;
  chats: Chats;
  userInfos: UserInfos;
}

export interface ForwardUser {
  username: string;
  userId: string;
}

export const ForwardDialog = ({
  ForwardedMessageId,
  setForwardedMessageId,
  chats,
  userInfos,
}: ForwardDialogProps) => {
  const [chatsToForwardTo, setChatsToForwardTo] = useState<ForwardUser[]>([]);
  const forwardMessage = useMutation(api.messages.forwardMessage);

  const handleForward = (user: ForwardUser) => {
    if (chatsToForwardTo.length == 0) {
      setChatsToForwardTo((prev) => [...prev, user]);
    } else {
      if (
        chatsToForwardTo.some(
          (forwardObject) => forwardObject.userId === user.userId,
        )
      ) {
        setChatsToForwardTo((prev) =>
          prev.filter((filteredUser) => filteredUser.userId !== user.userId),
        );
      } else {
        setChatsToForwardTo((prev) => [...prev, user]);
      }
    }
  };

  const onForwardSubmit = async (forwardObjects: ForwardUser[]) => {
    await forwardMessage({ messageId: ForwardedMessageId, forwardObjects });
  };

  useEffect(() => {
    console.log(chatsToForwardTo);
  }, [chatsToForwardTo]);

  return (
    <Dialog
      onOpenChange={(e) => (!e ? setForwardedMessageId("") : null)}
      open={ForwardedMessageId !== ""}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex">
            <p className="mt-1">Fordward</p>{" "}
            <Forward className="ml-2.5 align-top" />
          </DialogTitle>
          <DialogDescription>Select a user to forward them.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {chats?.map((chat, index) => (
            <div key={index}>
              {chat.users.map((user, index) => {
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex rounded-xl bg-secondary p-5",
                      user.username == userInfos[0]?.username
                        ? "h-0 p-0"
                        : null,
                    )}
                  >
                    <Checkbox
                      onClick={() =>
                        handleForward({
                          username: user.username,
                          userId: user._id,
                        })
                      }
                      className={cn(
                        "mr-3 mt-1 flex",
                        user.username == userInfos[0]?.username
                          ? "hidden"
                          : null,
                      )}
                    />
                    {user.username != userInfos[0]?.username ? (
                      <p className="font-medium">{user.username}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <Button
          onClick={async () => {
            await onForwardSubmit(chatsToForwardTo);
          }}
          disabled={chatsToForwardTo.length == 0}
        >
          <p>Forward</p> <Forward className="ml-1 p-0.5" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export { ForwardDialog as default };
