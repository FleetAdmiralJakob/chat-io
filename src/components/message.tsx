import { useUser } from "@clerk/nextjs";
import { useFloating, type ReferenceType } from "@floating-ui/react";
import { useLongPress } from "@reactuses/core";
import { useQueryWithStatus } from "~/app/convex-client-provider";
import { ForwardDialog } from "~/components/forward-message-dialog";
import { cn } from "~/lib/utils";
import { useQuery } from "convex-helpers/react/cache/hooks";
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
  Plus,
  Reply,
  Trash2,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ReactionHandler } from "./reactions";

dayjs.extend(relativeTime);

export type Message = NonNullable<
  FunctionReturnType<typeof api.messages.getMessages>
>[number];

export type UserInfos = [
  FunctionReturnType<typeof api.users.getUserData> | undefined,
  (
    | undefined
    | NonNullable<
        FunctionReturnType<typeof api.chats.getChatInfoFromId>
      >["otherUser"]
  ),
];

const EditedLabel = ({ message }: { message: Message }) => (
  <div className="text-secondary-foreground mr-2 text-[75%] font-bold">
    {message.type === "message" && message.modified && "Edited"}
  </div>
);

const ReplyToMessage = ({
  message,
  scrollToMessage,
}: {
  message: Message;
  scrollToMessage: (messageId: Id<"messages">) => void;
}) => {
  if (message.type === "message" && message.replyTo && !message.deleted) {
    return (
      <div
        onClick={() => {
          if (message.type === "message" && message.replyTo) {
            scrollToMessage(message.replyTo._id);
          }
        }}
        className="border-secondary-foreground bg-primary mb-2 cursor-pointer rounded-lg border p-2"
      >
        <div className="flex items-center justify-between">
          <p className="text-destructive-foreground text-sm">Replied to:</p>
        </div>

        <p className="text-sm">
          <strong>{message.replyTo.from.username}</strong>:{" "}
          {message.replyTo.deleted ? (
            <div className="flex">
              The original message was deleted
              <Ban className="ml-1 h-5 w-5" />
            </div>
          ) : (
            message.replyTo.content
          )}
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
  userInfos,
  setShowFullEmojiPicker,
  refsFullEmojiPicker,
  isInBottomHalf,
  setIsInBottomHalf,
  reactToMessageHandler,
  highlightedMessageId,
  scrollToMessage,
}: {
  message: Message;
  selectedMessageId: Id<"messages"> | null;
  setSelectedMessageId: React.Dispatch<
    React.SetStateAction<Id<"messages"> | null>
  >;
  setEditingMessageId: React.Dispatch<
    React.SetStateAction<Id<"messages"> | null>
  >;
  setReplyToMessageId: React.Dispatch<
    React.SetStateAction<Id<"messages"> | undefined>
  >;
  userInfos: UserInfos;
  setShowFullEmojiPicker: React.Dispatch<React.SetStateAction<boolean>>;
  isInBottomHalf: boolean | null;
  refsFullEmojiPicker: {
    setReference: (node: ReferenceType | null) => void;
  };
  setIsInBottomHalf: React.Dispatch<React.SetStateAction<boolean | null>>;
  reactToMessageHandler: (messageId: Id<"messages">, emoji: string) => void;
  highlightedMessageId: Id<"messages"> | null;
  scrollToMessage: (messageId: Id<"messages">) => void;
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
        existingMessages.map((message) => {
          if (
            message.type == "message" &&
            message.replyTo &&
            message.replyTo._id == messageId
          ) {
            return {
              ...message,
              replyTo: { ...message.replyTo, deleted: true },
            };
          }

          if (message._id === messageId) {
            return {
              ...message,
              content: "",
              deleted: true,
              reactions: [],
            };
          }
          return message;
        }),
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

  const checkClickPosition = (
    e: React.MouseEvent | TouchEvent | MouseEvent,
  ) => {
    const clickPosition =
      "touches" in e && e.touches[0]
        ? e.touches[0].clientY // TouchEvent
        : (e as React.MouseEvent | MouseEvent).clientY; // MouseEvent
    const windowHeight = window.innerHeight;
    setIsInBottomHalf(clickPosition >= windowHeight / 2);
  };

  const { ref, inView } = useInView({
    threshold: 0.9,
  });

  const userAgent = navigator.userAgent;
  const isMobile = /android|iPad|iPhone|iPod/i.test(userAgent);

  const { refs: refsContextModal, floatingStyles: floatingStylesContextModal } =
    useFloating({
      placement:
        message.from._id === userInfos[0]?._id
          ? isInBottomHalf
            ? "top-end"
            : "bottom-end"
          : isInBottomHalf
            ? "top-start"
            : "bottom-start",
    });

  const {
    refs: refsEmojiPickerQuickReaction,
    floatingStyles: floatingStylesEmojiPickerQuickReaction,
  } = useFloating({
    placement:
      message.from._id === userInfos[0]?._id
        ? isInBottomHalf
          ? "bottom-end"
          : "top-end"
        : isInBottomHalf
          ? "bottom-start"
          : "top-start",
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

  const [ForwardedMessageId, setForwardedMessageId] = useQueryState(
    // It is used to show if the forward dialog should be shown. If the string is empty the dialog should be not shown if there is an id inside it should
    "forward",
    parseAsString.withDefault(""),
  );

  const handleForward = () => {
    void setForwardedMessageId(message._id);
  };

  const replyToMessageHandler = (messageId: Id<"messages">) => {
    setReplyToMessageId(messageId);
    setSelectedMessageId(null);
    setShowFullEmojiPicker(false);
  };

  const chatContainerElement = document.getElementById("resizable-panel-chat");

  const onLongPress = (e: MouseEvent | TouchEvent) => {
    if (!isMobile) return;
    if (
      (message.type === "message" && message.deleted) ||
      message.type !== "message"
    )
      return;
    checkClickPosition(e);
    setSelectedMessageId(message._id);
  };

  const defaultOptions = {
    isPreventDefault: true,
    delay: 300,
  };
  const longPressEvent = useLongPress(onLongPress, defaultOptions);
  const existingChats = useQuery(api.chats.getChats);

  return (
    <div className="flex" ref={ref}>
      {chatContainerElement &&
      message._id == selectedMessageId &&
      message.type == "message"
        ? // The reason for the creation of the portal is that we need the portal at a point where it is over EVERYTHING even the input etc.
          createPortal(
            <div
              ref={(ref) => {
                refsEmojiPickerQuickReaction.setFloating(ref);
                refsFullEmojiPicker.setReference(ref);
              }}
              style={floatingStylesEmojiPickerQuickReaction}
              className="z-50 py-3 opacity-100"
            >
              <div className="border-secondary-foreground bg-secondary flex gap-4 rounded-lg border-2 p-2 text-2xl">
                <span
                  onMouseDown={() => reactToMessageHandler(message._id, "😂")}
                  role="button"
                  aria-label="React with laughing emoji"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      reactToMessageHandler(message._id, "😂");
                    }
                  }}
                  className={cn(
                    "bg-card dark:bg-primary flex aspect-square h-10 items-center justify-center rounded-full p-1 pt-1.5 hover:cursor-pointer",
                    {
                      "bg-muted-foreground dark:bg-card":
                        message.reactions.find(
                          (reaction) =>
                            reaction.emoji === "😂" &&
                            reaction.userId === userInfos[0]?._id,
                        ),
                    },
                  )}
                >
                  <span className="transition-transform hover:scale-125">
                    😂
                  </span>
                </span>
                <span
                  onMouseDown={() => reactToMessageHandler(message._id, "❤️")}
                  role="button"
                  aria-label="React with heart emoji"
                  tabIndex={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      reactToMessageHandler(message._id, "❤️");
                    }
                  }}
                  className={cn(
                    "bg-card dark:bg-primary flex aspect-square h-10 items-center justify-center rounded-full p-1 pt-1.5 hover:cursor-pointer",
                    {
                      "bg-muted-foreground dark:bg-card":
                        message.reactions.find(
                          (reaction) =>
                            reaction.emoji === "❤️" &&
                            reaction.userId === userInfos[0]?._id,
                        ),
                    },
                  )}
                >
                  <span className="transition-transform hover:scale-125">
                    ❤️
                  </span>
                </span>
                <span
                  onMouseDown={() => reactToMessageHandler(message._id, "👍")}
                  role="button"
                  aria-label="React with thumb up emoji"
                  tabIndex={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      reactToMessageHandler(message._id, "👍");
                    }
                  }}
                  className={cn(
                    "bg-card dark:bg-primary flex aspect-square h-10 items-center justify-center rounded-full p-1 pt-1.5 hover:cursor-pointer",
                    {
                      "bg-muted-foreground dark:bg-card":
                        message.reactions.find(
                          (reaction) =>
                            reaction.emoji === "👍" &&
                            reaction.userId === userInfos[0]?._id,
                        ),
                    },
                  )}
                >
                  <span className="transition-transform hover:scale-125">
                    👍
                  </span>
                </span>
                <span
                  onMouseDown={() => reactToMessageHandler(message._id, "👎")}
                  role="button"
                  aria-label="React with thumb down emoji"
                  tabIndex={3}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      reactToMessageHandler(message._id, "👎");
                    }
                  }}
                  className={cn(
                    "bg-card dark:bg-primary flex aspect-square h-10 items-center justify-center rounded-full p-1 pt-1.5 hover:cursor-pointer",
                    {
                      "bg-muted-foreground dark:bg-card":
                        message.reactions.find(
                          (reaction) =>
                            reaction.emoji === "👎" &&
                            reaction.userId === userInfos[0]?._id,
                        ),
                    },
                  )}
                >
                  <span className="transition-transform hover:scale-125">
                    👎
                  </span>
                </span>
                <span
                  onMouseDown={() => reactToMessageHandler(message._id, "😮")}
                  role="button"
                  aria-label="React with face with mouth open emoji"
                  tabIndex={4}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      reactToMessageHandler(message._id, "😮");
                    }
                  }}
                  className={cn(
                    "bg-card dark:bg-primary flex aspect-square h-10 items-center justify-center rounded-full p-1 pt-1.5 hover:cursor-pointer",
                    {
                      "bg-muted-foreground dark:bg-card":
                        message.reactions.find(
                          (reaction) =>
                            reaction.emoji === "😮" &&
                            reaction.userId === userInfos[0]?._id,
                        ),
                    },
                  )}
                >
                  <span className="transition-transform hover:scale-125">
                    😮
                  </span>
                </span>
                <span
                  onMouseDown={() =>
                    setShowFullEmojiPicker((prevValue) => !prevValue)
                  }
                  role="button"
                  aria-label="Open full emoji picker"
                  tabIndex={5}
                  onKeyDown={() => {
                    setShowFullEmojiPicker((prevValue) => !prevValue);
                  }}
                  className="bg-card dark:bg-primary flex aspect-square h-10 items-center justify-center rounded-full p-1 hover:cursor-pointer"
                >
                  <Plus className="transition-transform hover:scale-125" />
                </span>
              </div>
            </div>,
            chatContainerElement,
          )
        : null}
      {message.from.username == clerkUser.user?.username ? (
        <div
          className={cn("relative my-1 flex w-full flex-col items-end", {
            "mr-0 items-center":
              message.type == "pendingRequest" ||
              message.type == "rejectedRequest",
          })}
        >
          <EditedLabel message={message} />
          <ReplyToMessage message={message} scrollToMessage={scrollToMessage} />
          <div className="text- text-destructive-foreground text-[75%] italic">
            {message.type == "message" && !message.deleted ? (
              message.forwarded == undefined ? (
                ""
              ) : message.forwarded < 1 ? (
                ""
              ) : message.forwarded == 1 ? (
                <div className="flex">
                  Forwarded <Forward className="h-4" />
                </div>
              ) : (
                <div className="flex">
                  Frequently Forwarded <Forward className="h-4" />
                </div>
              )
            ) : (
              ""
            )}
          </div>
          <div
            {...longPressEvent}
            ref={(ref) => {
              refsContextModal.setReference(ref);
              refsEmojiPickerQuickReaction.setReference(ref);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (
                (message.type === "message" && message.deleted) ||
                message.type !== "message"
              )
                return;
              checkClickPosition(e);
              setSelectedMessageId(message._id);
            }}
            id={`message-${message._id}`}
            className={cn(
              "bg-accent max-w-[66.6667%] cursor-default rounded-xs p-3 break-words",
              {
                "sticky z-50 opacity-100": message._id === selectedMessageId,
                "border-secondary bg-primary my-2 max-w-[80%] border-2":
                  message.type == "pendingRequest" ||
                  message.type == "rejectedRequest",
                "mb-3":
                  message.type === "message" && message.reactions.length > 0,
                "animate-pulse": highlightedMessageId === message._id,
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
                  <div className="text-destructive-foreground font-semibold">
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
                  <div className="select-none lg:select-auto">
                    <div>{message.content}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <ReactionHandler
            message={message}
            selectedMessageId={selectedMessageId}
            userInfos={userInfos}
            side="right"
          />

          <div className="text-secondary-foreground mr-2 text-[75%] font-bold">
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
                  ref={refsContextModal.setFloating}
                  style={floatingStylesContextModal}
                  className="z-50 overflow-x-visible py-3 opacity-100"
                >
                  <div className="border-secondary-foreground rounded-xs border-2">
                    <div className="bg-secondary rounded-xs">
                      <div
                        className="flex w-full cursor-pointer p-2"
                        onClick={() => {
                          void navigator.clipboard.writeText(message.content);
                          setSelectedMessageId(null);
                          setShowFullEmojiPicker(false);
                          toast.success("Copied to clipboard");
                        }}
                      >
                        <CopyCheck />
                        <p className="ml-1">Copy</p>
                      </div>
                      <button
                        onClick={() => replyToMessageHandler(message._id)}
                        className="border-secondary-foreground flex w-full cursor-pointer border-t-2 p-2 pr-8"
                      >
                        <Reply />
                        <p className="ml-1">Reply</p>
                      </button>
                      <button
                        className="border-secondary-foreground flex w-full cursor-pointer border-t-2 p-2 pr-8"
                        onClick={() => {
                          handleForward();
                        }}
                      >
                        <Forward />
                        <p className="ml-1">Forward</p>
                      </button>
                      <ForwardDialog
                        ForwardedMessageId={ForwardedMessageId}
                        setForwardedMessageId={setForwardedMessageId}
                        chats={existingChats}
                        userInfos={userInfos}
                      />
                      <button
                        className="border-secondary-foreground flex w-full cursor-pointer border-y-2 p-2 pr-8"
                        onClick={() => {
                          setEditingMessageId(message._id);
                          setSelectedMessageId(null);
                          setShowFullEmojiPicker(false);
                        }}
                      >
                        <Pen />
                        <p className="ml-1">Edit</p>
                      </button>
                      <button
                        className="text-accent flex w-full p-2"
                        onMouseDown={() => {
                          void deleteMessage({
                            messageId: message._id,
                            chatId: message.privateChatId,
                          });
                          setSelectedMessageId(null);
                          setShowFullEmojiPicker(false);
                        }}
                      >
                        <Trash2 />
                        <div className="ml-1">Delete</div>
                      </button>{" "}
                      <div className="border-secondary-foreground text-secondary-foreground flex border-t-2 p-2 pr-8">
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
          ref={(ref) => {
            refsContextModal.setReference(ref);
            refsEmojiPickerQuickReaction.setReference(ref);
          }}
          className={cn("relative my-1 flex w-full flex-col items-start", {
            "ml-0 items-center":
              message.type == "pendingRequest" ||
              message.type == "rejectedRequest",
            "my-3": message.type === "message" && message.replyTo,
          })}
        >
          <EditedLabel message={message} />
          <ReplyToMessage message={message} scrollToMessage={scrollToMessage} />
          <div
            {...longPressEvent}
            ref={(ref) => {
              refsContextModal.setReference(ref);
              refsEmojiPickerQuickReaction.setReference(ref);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (
                (message.type === "message" && message.deleted) ||
                message.type !== "message"
              )
                return;
              checkClickPosition(e);
              setSelectedMessageId(message._id);
            }}
            id={`message-${message._id}`}
            className={cn(
              "bg-secondary max-w-[66.6667%] cursor-default rounded-xs p-3 break-words",
              {
                "sticky z-50 opacity-100": message._id == selectedMessageId,
                "border-secondary bg-primary my-2 max-w-[80%] border-2":
                  message.type === "pendingRequest" ||
                  message.type === "rejectedRequest",
                "mb-3":
                  message.type === "message" && message.reactions.length > 0,
                "animate-pulse": highlightedMessageId === message._id,
              },
            )}
          >
            {message.type === "message" && message.deleted ? (
              <div className="flex font-medium">
                <Ban />
                <p className="ml-2.5">This message was deleted</p>
              </div>
            ) : message.type != "message" ? (
              <div className="text-destructive-foreground font-semibold">
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
                    `The request of ${
                      chatInfo.data?.otherUser[0]?.username +
                      " to clear the chat"
                    } has expired`
                  ) : (
                    "You have rejected the request to clear the chat"
                  )}
                </div>
                <div className="flex justify-between">
                  {message.type === "pendingRequest" ? (
                    <>
                      <button
                        onClick={acceptClearRequestHandler(message._id)}
                        className="bg-accept mt-4 flex rounded-xs p-2 px-4"
                      >
                        <CircleCheck className="mr-1 p-0.5" />
                        <p>Accept</p>
                      </button>
                      <button
                        onClick={rejectClearRequestHandler(
                          message.privateChatId,
                          message._id,
                        )}
                        className="bg-accent mt-4 ml-4 flex rounded-xs p-2 px-4 lg:ml-0"
                      >
                        <CircleX className="mr-1 p-0.5" />
                        <p>Reject</p>{" "}
                      </button>{" "}
                    </>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="select-none lg:select-auto">
                <div>{message.content}</div>
              </div>
            )}
          </div>

          <ReactionHandler
            message={message}
            selectedMessageId={selectedMessageId}
            userInfos={userInfos}
            side="left"
          />

          {chatContainerElement &&
          message._id == selectedMessageId &&
          message.type == "message"
            ? // The reason for the creation of the portal is that we need the portal at a point where it is over EVERYTHING even the input etc.
              createPortal(
                <div
                  ref={refsContextModal.setFloating}
                  style={floatingStylesContextModal}
                  className="z-50 py-3 opacity-100"
                >
                  <div className="border-secondary-foreground rounded-xs border-2">
                    <div className="bg-secondary rounded-xs">
                      <div
                        onClick={() => {
                          void navigator.clipboard.writeText(message.content);
                          setSelectedMessageId(null);
                          setShowFullEmojiPicker(false);
                          toast.success("Copied to clipboard");
                        }}
                        className="flex cursor-pointer p-2"
                      >
                        <CopyCheck />
                        <p className="ml-1">Copy</p>
                      </div>
                      <button
                        onClick={() => replyToMessageHandler(message._id)}
                        className="border-secondary-foreground flex w-full cursor-pointer border-y-2 p-2 pr-8"
                      >
                        <Reply />
                        <p className="ml-1">Reply</p>
                      </button>
                      <div
                        onClick={() => {
                          handleForward();
                        }}
                        className="border-secondary-foreground flex w-full cursor-pointer border-b-2 p-2 pr-8"
                      >
                        <Forward />
                        <p className="ml-1">Forward</p>
                      </div>
                      <ForwardDialog
                        ForwardedMessageId={ForwardedMessageId}
                        setForwardedMessageId={setForwardedMessageId}
                        chats={existingChats}
                        userInfos={userInfos}
                      />
                      <div className="text-secondary-foreground flex p-2 pr-8">
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
