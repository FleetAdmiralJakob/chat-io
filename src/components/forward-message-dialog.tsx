import { api } from "#convex/_generated/api";
import { type Id } from "#convex/_generated/dataModel";
import { type UserInfos } from "~/components/message";
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
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { LoaderCircle } from "lucide-react";
import React, { useState, type Dispatch, type SetStateAction } from "react";

interface ForwardDialogProps {
  ForwardedMessageId: string;
  setForwardedMessageId: Dispatch<SetStateAction<string>>;
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
  userInfos,
}: ForwardDialogProps) => {
  const [chatsToForwardTo, setChatsToForwardTo] = useState<ForwardUser[]>([]);
  const chats = useQuery(api.chats.getChats);
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
    setLoading(true);
    await forwardMessage({ messageId: ForwardedMessageId, forwardObjects });
    setForwardedMessageId("");
    setChatsToForwardTo([]);
    setLoading(false);
  };

  const closeDialog = () => {
    setForwardedMessageId("");
    setChatsToForwardTo([]);
    setLoading(false);
  };

  const [loading, setLoading] = useState(false);

  return (
    <Dialog
      onOpenChange={(e) => (!e ? closeDialog() : null)}
      open={ForwardedMessageId !== ""}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex">
            <p className="mt-1">Forward</p>{" "}
          </DialogTitle>
          <DialogDescription>
            Select a user to forward the message to.
          </DialogDescription>
        </DialogHeader>
        <div
          className={cn(
            "grid max-h-72 gap-2 overflow-auto",
            chats === undefined ? "flex justify-center" : null,
          )}
        >
          {chats === undefined ? (
            <LoaderCircle className="mr-1.5 animate-spin justify-center p-0.5" />
          ) : (
            chats?.map((chat, index) => (
              <div key={index}>
                {chat.support ? (
                  <div
                    onClick={() =>
                      handleForward({
                        username: "Chat.io Support",
                        userId: chat._id,
                        chatId: chat._id,
                      })
                    }
                    key={index}
                    className="bg-secondary flex cursor-pointer rounded-xl p-5"
                  >
                    <Checkbox
                      checked={
                        chatsToForwardTo.length > 0
                          ? chatsToForwardTo.some(
                              (forwardObject) =>
                                forwardObject.userId === chat._id,
                            )
                          : false
                      }
                      className="mt-1 mr-3 flex"
                    />
                    <div className="flex">
                      Chat.io <Badge>Support</Badge>
                    </div>
                  </div>
                ) : null}
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
                    className="bg-secondary flex cursor-pointer rounded-xl p-5"
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
                      className="mt-1 mr-3 flex"
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
                        "bg-secondary flex cursor-pointer rounded-xl p-5",
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
                          "mt-1 mr-3 flex",
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
          disabled={chatsToForwardTo.length == 0 || loading}
        >
          <p>
            {!loading ? (
              "Forward"
            ) : (
              <div className="flex">
                <LoaderCircle className="mr-1.5 animate-spin p-0.5" />
                <p className="mt-0.5">Processing...</p>
              </div>
            )}
          </p>
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export { ForwardDialog as default };
