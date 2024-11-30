import { useUser } from "@clerk/nextjs";
import { useFloating } from "@floating-ui/react";
import { useQueryWithStatus } from "~/app/convex-client-provider";
import { cn } from "~/lib/utils";
import { useMutation } from "convex/react";
import { type FunctionReturnType } from "convex/server";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Ban,
  CircleCheck,
  CircleX,
  Clock,
  CopyCheck,
  Forward,
  Info,
  Pen,
  Reply,
  Trash2,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { type Id } from "../../convex/_generated/dataModel";

dayjs.extend(relativeTime);

type Message = NonNullable<
  FunctionReturnType<typeof api.messages.getMessages>
>[number];

const EditedLabel = ({ message }: { message: Message }) => (
  <div className="mr-2 text-[75%] font-bold text-secondary-foreground">
    {message.type === "message" && message.modified && "Edited"}
  </div>
);

const ReplyToMessage = ({ message }: { message: Message }) => {
  if (message.type === "message" && message.replyTo) {
    return (
      <div className="mb-2 rounded-lg border border-secondary-foreground bg-primary p-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-destructive-foreground">Replied to:</p>
        </div>

        <p className="text-sm">
          <strong>{message.replyTo.from.username}</strong>:{" "}
          {message.replyTo.content}
        </p>
      </div>
    );
  } else {
    return null;
  }
};

export const Message = ({
  message,
  selectedMessageId,
  setSelectedMessageId,
  setEditingMessageId,
  setReplyToMessageId,
  userInfo,
}: {
  message: Message;
  selectedMessageId: string | null;
  setSelectedMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingMessageId: React.Dispatch<
    React.SetStateAction<Id<"messages"> | null>
  >;
  setReplyToMessageId: React.Dispatch<
    React.SetStateAction<Id<"messages"> | undefined>
  >;
  userInfo: FunctionReturnType<typeof api.users.getUserData> | undefined;
}) => {
  const clerkUser = useUser();

  const deleteMessage = useMutation(
    api.messages.deleteMessage,
  ).withOptimisticUpdate((localStore, args) => {
    const messageId: Id<"messages"> = args.messageId as Id<"messages">;
    const chatId: Id<"privateChats"> = args.chatId as Id<"privateChats">;

    const existingMessages = localStore.getQuery(api.messages.getMessages, {
      chatId,
    });
    const existingChats = localStore.getQuery(api.chats.getChats);

    if (existingMessages && existingChats) {
      localStore.setQuery(
        api.messages.getMessages,
        { chatId },
        existingMessages.map((message) =>
          message._id === messageId ? { ...message, deleted: true } : message,
        ),
      );

      localStore.setQuery(
        api.chats.getChats,
        {},
        existingChats.map((chat) => {
          if (chat._id === chatId && chat.lastMessage?._id === messageId) {
            return {
              ...chat,
              lastMessage: {
                ...chat.lastMessage,
                content: "",
                deleted: true,
              },
            };
          } else {
            return chat;
          }
        }),
      );
    }
  });

  const reactToMessage = useMutation(
    api.messages.reactToMessage,
  ).withOptimisticUpdate((localStore, args) => {
    const messageId = args.messageId;
    const emoji = args.reaction;

    if (!userInfo) return;

    const reaction = {
      _id: crypto.randomUUID() as Id<"reactions">,
      _creationTime: Date.now(),
      messageId,
      userId: userInfo._id,
      emoji,
      userInfo,
    };

    const existingMessages = localStore.getQuery(api.messages.getMessages, {
      chatId: message.privateChatId,
    });

    if (existingMessages) {
      localStore.setQuery(
        api.messages.getMessages,
        { chatId: message.privateChatId },
        existingMessages.map((message) =>
          message._id === messageId && message.type === "message"
            ? {
                ...message,
                reactions: message.reactions?.find(
                  (reaction) => reaction.emoji === emoji,
                )
                  ? message.reactions.filter(
                      (reaction) => reaction.emoji !== emoji,
                    )
                  : [...(message.reactions || []), reaction],
              }
            : message,
        ),
      );
    }
  });

  const [isInBottomHalf, setIsInBottomHalf] = useState<boolean | null>(null);

  const checkClickPosition = (e: React.MouseEvent) => {
    const clickPosition = e.clientY;
    const windowHeight = window.innerHeight;
    setIsInBottomHalf(clickPosition >= windowHeight / 2);
  };

  const { ref, inView } = useInView({
    threshold: 0.9,
  });

  const userAgent = navigator.userAgent;
  const isMobile = /android/i.test(userAgent)
    ? true
    : /iPad|iPhone|iPod/.test(userAgent)
      ? true
      : false;

  const [messageOwner, setMessageOwner] = useState<boolean | null>(null);
  const { refs, floatingStyles } = useFloating({
    placement: messageOwner
      ? isInBottomHalf
        ? "top-end"
        : "bottom-end"
      : isInBottomHalf
        ? "top-start"
        : "bottom-start",
  });

  const markRead = useMutation(api.messages.markMessageRead);

  const acceptClearRequest = useMutation(api.clearRequests.acceptClearRequest);

  const chatInfo = useQueryWithStatus(api.chats.getChatInfoFromId, {
    chatId: message.privateChatId,
  });

  const rejectClearRequest = useMutation(api.clearRequests.rejectClearRequest);

  const rejectClearRequestHandler =
    (chatId: string, requestId: string) => async () => {
      await rejectClearRequest({ chatId, requestId });
    };

  const acceptClearRequestHandler = (requestId: string) => async () => {
    if (message.type == "pendingRequest") {
      await acceptClearRequest({ requestId });
    } else {
      console.error("Error");
    }
  };

  // A clear chat request remains pending for 24 hours. If it is not accepted within that time,
  // it will be marked as expired. This function calculates the remaining time
  // before the request expires, in order to inform the user about the time left.
  const getTimeRemaining = () => {
    const expiryTime = dayjs(message._creationTime).add(24, "hours");
    return dayjs().to(expiryTime);
  };

  useEffect(() => {
    const markMessageAsRead = async () => {
      if (inView && message.sent) {
        await markRead({ messageId: message._id });
      }
    };

    void markMessageAsRead();
  }, [inView, markRead, message._id, message.sent, message.type]);

  const sentInfo = () => {
    return (
      <>
        Sent at {dayjs(message._creationTime).hour()}:
        {dayjs(message._creationTime).minute() < 10
          ? "0" + dayjs(message._creationTime).minute()
          : dayjs(message._creationTime).minute()}
        {", "}
        {dayjs(message._creationTime).date() < 10
          ? "0" + dayjs(message._creationTime).date()
          : dayjs(message._creationTime).date()}
        .
        {dayjs(message._creationTime).month() + 1 < 10
          ? "0" + (dayjs(message._creationTime).month() + 1).toString()
          : dayjs(message._creationTime).month() + 1}
        .{dayjs(message._creationTime).year()}
      </>
    );
  };

  const replyToMessageHandler = (messageId: Id<"messages">) => {
    setReplyToMessageId(messageId);
    setSelectedMessageId(null);
  };

  const chatContainerElement = document.getElementById("resizable-panel-chat");

  return (
    <div className="flex" ref={ref}>
      {message.from.username == clerkUser.user?.username ? (
        <div
          ref={refs.setReference}
          className={cn("my-1 flex w-full flex-col items-end", {
            "mr-0 items-center":
              message.type == "pendingRequest" ||
              message.type == "rejectedRequest",
          })}
        >
          <EditedLabel message={message} />
          <ReplyToMessage message={message} />
          <div
            onContextMenu={(e) => {
              e.preventDefault();
              if (message.type === "message" && message.deleted) return;
              checkClickPosition(e);
              setSelectedMessageId(message._id);
              setMessageOwner(true);
            }}
            onClick={(e) => {
              if (!isMobile) return;
              if (message.type === "message" && message.deleted) return;
              checkClickPosition(e);
              setSelectedMessageId(message._id);
              setMessageOwner(true);
            }}
            className={cn(
              "max-w-[66.6667%] cursor-default break-words rounded-sm bg-accent p-3",
              {
                "sticky z-50 opacity-100": message._id === selectedMessageId,
                "my-2 max-w-[80%] border-2 border-secondary bg-primary":
                  message.type == "pendingRequest" ||
                  message.type == "rejectedRequest",
              },
            )}
          >
            {message.type === "message" && message.deleted ? (
              <div className="flex font-medium">
                <Ban />
                <p className="ml-2.5">This message was deleted</p>
              </div>
            ) : (
              <div>
                {message.type != "message" ? (
                  <div className="font-semibold text-destructive-foreground">
                    {message.type === "pendingRequest" ? (
                      <>
                        <p>You&apos;ve sent a request to clear the chat</p>
                        <div className="mt-2 flex items-center text-xs">
                          <Clock className="mr-1 h-4 w-4" />
                          <span>Expires {getTimeRemaining()}</span>
                        </div>
                      </>
                    ) : message.type === "expiredRequest" ? (
                      "Your request to clear the chat has expired"
                    ) : (
                      chatInfo.data?.otherUser[0]?.username +
                      " has rejected the request to clear the chat"
                    )}
                  </div>
                ) : (
                  <div>{message.content}</div>
                )}
              </div>
            )}
          </div>
          <div className="mr-2 text-[75%] font-bold text-secondary-foreground">
            {message.type == "message" && !message.deleted
              ? message.readBy
                ? message.readBy.map((user) => {
                    if (user.username != clerkUser.user?.username) {
                      return "Read";
                    } else {
                      if (message.readBy.length === 1 && message.sent) {
                        return "Sent";
                      } else if (message.readBy.length === 1) {
                        return "Sending";
                      } else {
                        return null;
                      }
                    }
                  })
                : null
              : null}
          </div>
          {chatContainerElement &&
          message._id == selectedMessageId &&
          message.type == "message"
            ? // The reason for the creation of the portal is that we need the portal at a point where it is over EVERYTHING even the input etc.
              createPortal(
                <div
                  ref={refs.setFloating}
                  style={floatingStyles}
                  className="z-50 overflow-x-visible pb-3 opacity-100"
                >
                  <div className="rounded-sm border-2 border-secondary-foreground">
                    <div className="rounded-sm bg-secondary">
                      <div
                        className="flex w-full cursor-pointer p-2"
                        onClick={() => {
                          void navigator.clipboard.writeText(message.content);
                          setSelectedMessageId(null);
                          toast.success("Copied to clipboard");
                        }}
                      >
                        <CopyCheck />
                        <p className="ml-1">Copy</p>
                      </div>
                      <button
                        onClick={() => replyToMessageHandler(message._id)}
                        className="flex w-full cursor-pointer border-t-2 border-secondary-foreground p-2 pr-8"
                      >
                        <Reply />
                        <p className="ml-1">Reply</p>
                      </button>
                      <div className="flex w-full cursor-pointer border-t-2 border-secondary-foreground p-2 pr-8">
                        <Forward />
                        <p className="ml-1">Forward</p>
                      </div>
                      <button
                        className="flex w-full cursor-pointer border-y-2 border-secondary-foreground p-2 pr-8"
                        onClick={() => {
                          setEditingMessageId(message._id);
                          setSelectedMessageId(null);
                        }}
                      >
                        <Pen />
                        <p className="ml-1">Edit</p>
                      </button>
                      <button
                        className="flex w-full p-2 text-accent"
                        onMouseDown={() => {
                          void deleteMessage({
                            messageId: message._id,
                            chatId: message.privateChatId,
                          });
                          setSelectedMessageId(null);
                        }}
                      >
                        <Trash2 />
                        <div className="ml-1">Delete</div>
                      </button>{" "}
                      <div className="flex border-t-2 border-secondary-foreground p-2 pr-8 text-secondary-foreground">
                        <Info />
                        <p className="ml-1">{sentInfo()}</p>
                      </div>
                    </div>
                  </div>
                </div>,
                chatContainerElement,
              )
            : null}
        </div>
      ) : (
        <div
          ref={refs.setReference}
          className={cn("my-1 flex w-full flex-col items-start", {
            "ml-0 items-center":
              message.type == "pendingRequest" ||
              message.type == "rejectedRequest",
            "my-3": message.type === "message" && message.replyTo,
          })}
        >
          <EditedLabel message={message} />
          <ReplyToMessage message={message} />
          <div
            ref={refs.setReference}
            onContextMenu={(e) => {
              e.preventDefault();
              if (message.type === "message" && message.deleted) return;
              checkClickPosition(e);
              setSelectedMessageId(message._id);
              setMessageOwner(false);
            }}
            onClick={(e) => {
              if (!isMobile) return;
              if (message.type === "message" && message.deleted) return;
              checkClickPosition(e);
              setSelectedMessageId(message._id);
              setMessageOwner(false);
            }}
            className={cn(
              "max-w-[66.6667%] cursor-default break-words rounded-sm bg-secondary p-3",
              {
                "sticky z-50 opacity-100": message._id == selectedMessageId,
                "my-2 max-w-[80%] border-2 border-secondary bg-primary":
                  message.type === "pendingRequest" ||
                  message.type === "rejectedRequest",
              },
            )}
          >
            {message.type === "message" && message.deleted ? (
              <div className="flex font-medium">
                <Ban />
                <p className="ml-2.5">This message was deleted</p>
              </div>
            ) : message.type != "message" ? (
              <div className="font-semibold text-destructive-foreground">
                <div>
                  {message.type === "pendingRequest" ? (
                    <>
                      <span>
                        {chatInfo.data?.otherUser[0]?.username} has sent a
                        request to clear the chat
                      </span>
                      <div className="mt-2 flex items-center text-xs">
                        <Clock className="mr-1 h-4 w-4" />
                        <span>Expires {getTimeRemaining()}</span>
                      </div>
                    </>
                  ) : message.type === "expiredRequest" ? (
                    `The request of ${chatInfo.data?.otherUser[0]?.username + " to clear the chat"} has expired`
                  ) : (
                    "You have rejected the request to clear the chat"
                  )}
                </div>
                <div className="flex justify-between">
                  {message.type === "pendingRequest" ? (
                    <>
                      <button
                        onClick={acceptClearRequestHandler(message._id)}
                        className="mt-4 flex rounded-sm bg-accept p-2 px-4"
                      >
                        <CircleCheck className="mr-1 p-0.5" />
                        <p>Accept</p>
                      </button>
                      <button
                        onClick={rejectClearRequestHandler(
                          message.privateChatId,
                          message._id,
                        )}
                        className="ml-4 mt-4 flex rounded-sm bg-accent p-2 px-4 lg:ml-0"
                      >
                        <CircleX className="mr-1 p-0.5" />
                        <p>Reject</p>{" "}
                      </button>{" "}
                    </>
                  ) : null}
                </div>
              </div>
            ) : (
              message.content
            )}
          </div>
          {chatContainerElement &&
          message._id == selectedMessageId &&
          message.type == "message"
            ? createPortal(
                <div
                  ref={refs.setFloating}
                  style={floatingStyles}
                  className={cn(
                    "z-50 mt-4 pb-3 opacity-100",
                    isInBottomHalf ? "mt-0" : null,
                  )}
                >
                  <div className="rounded-sm border-2 border-secondary-foreground">
                    <div className="rounded-sm bg-secondary">
                      <div
                        onClick={() => {
                          void navigator.clipboard.writeText(message.content);
                          setSelectedMessageId(null);
                          toast.success("Copied to clipboard");
                        }}
                        className="flex cursor-pointer p-2"
                      >
                        <CopyCheck />
                        <p className="ml-1">Copy</p>
                      </div>
                      <button
                        onClick={() => replyToMessageHandler(message._id)}
                        className="flex w-full cursor-pointer border-y-2 border-secondary-foreground p-2 pr-8"
                      >
                        <Reply />
                        <p className="ml-1">Reply</p>
                      </button>
                      <div className="flex w-full cursor-pointer border-b-2 border-secondary-foreground p-2 pr-8">
                        <Forward />
                        <p className="ml-1">Forward</p>
                      </div>
                      <div className="flex p-2 pr-8 text-secondary-foreground">
                        <Info />
                        <p className="ml-1">{sentInfo()}</p>
                      </div>
                    </div>
                  </div>
                </div>,
                chatContainerElement,
              )
            : null}
        </div>
      )}
    </div>
  );
};
