import { Chats } from "~/components/chat-overview";
import { UserInfos } from "~/components/message";
import Badge from "~/components/ui/badge";
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
import { Forward, LoaderCircle } from "lucide-react";
import React, { Dispatch, SetStateAction, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ForwardDialogProps {
  ForwardedMessageId: string;
  setForwardedMessageId: Dispatch<SetStateAction<string>>;
  chats: Chats | undefined;
  userInfos: UserInfos;
}

export interface ForwardUser {
  username: string;
  userId: string;
  chatId: Id<"privateChats">;
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
    setForwardedMessageId("");
    setChatsToForwardTo([]);
  };

  const closeDialog = () => {
    setForwardedMessageId("");
    setChatsToForwardTo([]);
  };

  return (
    <Dialog
      onOpenChange={(e) => (!e ? closeDialog() : null)}
      open={ForwardedMessageId !== ""}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex">
            <p className="mt-1">Forward</p>{" "}
          </DialogTitle>
          <DialogDescription>Select a user to forward them.</DialogDescription>
        </DialogHeader>
        <div
          className={cn(
            "grid max-h-72 gap-4 overflow-auto",
            chats === undefined ? "flex justify-center" : null,
          )}
        >
          {chats === undefined ? (
            <LoaderCircle className="mr-1.5 animate-spin justify-center p-0.5" />
          ) : (
            chats?.map((chat, index) => (
              <div key={index}>
                {chat.users.length === 0 ? (
                  <div
                    onClick={() =>
                      handleForward({
                        username: userInfos[0]!.username,
                        userId: userInfos[0]!._id,
                        chatId: chat._id,
                      })
                    }
                    key={index}
                    className="mt-4 flex cursor-pointer rounded-xl bg-secondary p-5"
                  >
                    <Checkbox
                      checked={
                        chatsToForwardTo.length > 0
                          ? chatsToForwardTo.some(
                              (forwardObject) =>
                                forwardObject.userId === userInfos[0]!._id,
                            )
                          : false
                      }
                      className="mr-3 mt-1 flex"
                    />
                    <div className="flex">
                      My Notes <Badge>Tool</Badge>
                    </div>
                  </div>
                ) : null}
                {chat.users.map((user, index) => {
                  return (
                    <div
                      onClick={() =>
                        handleForward({
                          username: user.username,
                          userId: user._id,
                          chatId: chat._id,
                        })
                      }
                      key={index}
                      className={cn(
                        "flex cursor-pointer rounded-xl bg-secondary p-5",
                        user.username == userInfos[0]?.username
                          ? "h-0 p-0"
                          : null,
                      )}
                    >
                      <Checkbox
                        checked={
                          chatsToForwardTo.length > 0
                            ? chatsToForwardTo.some(
                                (forwardObject) =>
                                  forwardObject.userId === user._id,
                              )
                            : false
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
            ))
          )}
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
