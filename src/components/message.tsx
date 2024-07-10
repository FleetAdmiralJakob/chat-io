import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Ban,
  CircleCheck,
  CircleX,
  CopyCheck,
  Forward,
  Info,
  Trash2,
} from "lucide-react";
import { FunctionReturnType } from "convex/server";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useFloating } from "@floating-ui/react";
import { Toaster } from "~/components/ui/sonner";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { useQueryWithStatus } from "~/app/convex-client-provider";

dayjs.extend(relativeTime);

export const Message = ({
  message,
  selectedMessageId,
  setSelectedMessageId,
}: {
  message: NonNullable<
    FunctionReturnType<typeof api.messages.getMessages>
  >[number];
  selectedMessageId: string | null;
  setSelectedMessageId: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  const clerkUser = useUser();

  const deleteMessage = useMutation(
    api.messages.deleteMessage,
  ).withOptimisticUpdate(async (localStore, args) => {
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

  const [isScreenTop, setScreenTop] = useState<boolean | null>(null);

  const checkClickPosition = (e: React.MouseEvent) => {
    const clickPosition = e.clientY;
    const windowHeight = window.innerHeight;
    const isInBottomHalf = clickPosition >= windowHeight / 2;

    if (isInBottomHalf) {
      setScreenTop(true);
    } else {
      setScreenTop(false);
    }
  };

  const { ref, inView } = useInView({
    threshold: 0.9,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent;
      if (/android/i.test(userAgent)) {
        setIsMobile(true);
      } else if (/iPad|iPhone|iPod/.test(userAgent)) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };

    checkIfMobile();
  }, []);

  const [messageOwner, setMessageOwner] = useState<boolean | null>(null);
  const { refs, floatingStyles } = useFloating({
    placement: messageOwner
      ? isScreenTop
        ? "top-end"
        : "bottom-end"
      : isScreenTop
        ? "top-start"
        : "bottom-start",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const markRead = useMutation(api.messages.markMessageRead);

  const deleteAllMessagesInChat = useMutation(
    api.messages.deleteAllMessagesInChat,
  );

  const chatInfo = useQueryWithStatus(api.chats.getChatInfoFromId, {
    chatId: message.privateChatId,
  });

  const rejectRequest = useMutation(api.messages.rejectRequest);

  const rejectRequestHandler =
    (chatId: string, messageId: string) => async () => {
      await rejectRequest({ chatId, messageId });
    };

  const deleteAllMessagesinChat = (chatId: string) => async () => {
    await deleteAllMessagesInChat({ chatId });
  };

  useEffect(() => {
    if (inView && message.sent) {
      markRead({ messageId: message._id });
    }
  }, [inView, message._id, message.deleted, deleteMessage]);

  return (
    <>
      <Toaster />

      {isModalOpen && message.type == "message" ? (
        <div
          onClick={() => setIsModalOpen(!isModalOpen)}
          className="fixed inset-0 z-10 bg-black opacity-75"
        ></div>
      ) : null}
      <div className="flex" ref={ref}>
        {message.from.username == clerkUser.user?.username ? (
          <div
            ref={refs.setReference}
            className={cn("my-1 mr-4 flex w-full flex-col items-end", {
              "mr-0 items-center":
                message.type == "request" || message.type == "rejected",
            })}
          >
            <div
              onContextMenu={(e) => {
                e.preventDefault();
                if (message.deleted) return;
                checkClickPosition(e);
                setIsModalOpen(!isModalOpen);
                setSelectedMessageId(message._id);
                setMessageOwner(true);
              }}
              onClick={(e) => {
                if (!isMobile) return;
                if (message.deleted) return;
                checkClickPosition(e);
                setIsModalOpen(!isModalOpen);
                setSelectedMessageId(message._id);
                setMessageOwner(true);
              }}
              className={cn(
                "max-w-[66.6667%] cursor-default break-words rounded-sm bg-accent p-3",
                {
                  "sticky z-50 opacity-100": message._id === selectedMessageId,
                  "my-2 max-w-[80%] border-2 border-secondary bg-primary":
                    message.type == "request" || message.type == "rejected",
                },
              )}
            >
              {message.deleted ? (
                <div className="flex font-medium">
                  <Ban />
                  <p className="ml-2.5">This message was deleted</p>
                </div>
              ) : (
                <div>
                  {message.type != "message" ? (
                    <div className="font-semibold text-destructive-foreground">
                      {message.type == "request"
                        ? "You`ve send a request"
                        : chatInfo.data?.otherUser[0]?.username +
                          " has rejected the request"}
                    </div>
                  ) : (
                    <div>{message.content}</div>
                  )}
                </div>
              )}
            </div>
            <div className="mr-2 text-[75%] font-bold text-secondary-foreground">
              {!message.deleted && message.type == "message"
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
            {message._id == selectedMessageId &&
            isModalOpen &&
            message.type == "message" ? (
              <div
                ref={refs.setFloating}
                style={floatingStyles}
                className="z-50 pb-3 opacity-100"
              >
                <div className="rounded-sm border-2 border-secondary-foreground">
                  <div className="rounded-sm bg-secondary">
                    <div
                      className="flex cursor-pointer p-2"
                      onClick={() => {
                        navigator.clipboard.writeText(message.content);
                        setIsModalOpen(!isModalOpen);
                        toast.success("Copied to clipboard");
                      }}
                    >
                      <CopyCheck />
                      <p className="ml-1">Copy</p>
                    </div>
                    <div className="flex cursor-pointer border-y-2 border-secondary-foreground p-2 pr-8">
                      <Forward />
                      <p className="ml-1">Answer</p>
                    </div>
                    <button
                      className="flex w-full p-2 text-accent"
                      onMouseDown={() => {
                        deleteMessage({
                          messageId: message._id,
                          chatId: message.privateChatId,
                        });
                        setIsModalOpen(!isModalOpen);
                      }}
                    >
                      <Trash2 />
                      <div className="ml-1">Delete</div>
                    </button>{" "}
                    <div className="flex border-t-2 border-secondary-foreground p-2 pr-8 text-secondary-foreground">
                      <Info />
                      <p className="ml-1">
                        Sent at {dayjs(message._creationTime).hour()}:
                        {dayjs(message._creationTime).minute() < 10
                          ? "0" + dayjs(message._creationTime).minute()
                          : dayjs(message._creationTime).minute()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div
            className={cn("my-1 ml-4 flex w-full justify-start", {
              "ml-0 justify-center":
                message.type == "request" || message.type == "rejected",
            })}
          >
            <div
              ref={refs.setReference}
              onContextMenu={(e) => {
                e.preventDefault();
                if (message.deleted) return;
                checkClickPosition(e);
                setIsModalOpen(!isModalOpen);
                setSelectedMessageId(message._id);
                setMessageOwner(false);
              }}
              onClick={(e) => {
                if (!isMobile) return;
                if (message.deleted) return;
                checkClickPosition(e);
                setIsModalOpen(!isModalOpen);
                setSelectedMessageId(message._id);
                setMessageOwner(false);
              }}
              className={cn(
                "max-w-[66.6667%] cursor-default break-words rounded-sm bg-secondary p-3",
                {
                  "sticky z-50 opacity-100": message._id == selectedMessageId,
                  "my-2 max-w-[80%] border-2 border-secondary bg-primary":
                    message.type == "request" || message.type == "rejected",
                },
              )}
            >
              {message.deleted ? (
                <div className="flex font-medium">
                  <Ban />
                  <p className="ml-2.5">This message was deleted</p>
                </div>
              ) : message.type != "message" ? (
                <div className="font-semibold text-destructive-foreground">
                  <p>
                    {message.type == "request"
                      ? chatInfo.data?.otherUser[0]?.username +
                        " has send a delete Chat request"
                      : "You has rejected the request"}
                  </p>
                  <div className="flex justify-between">
                    {message.type == "request" ? (
                      <>
                        <button
                          onClick={deleteAllMessagesinChat(
                            message.privateChatId,
                          )}
                          className="mt-4 flex rounded-sm bg-accept p-2 px-4"
                        >
                          <CircleCheck className="mr-1 p-0.5" />
                          <p>Accept</p>
                        </button>
                        <button
                          onClick={rejectRequestHandler(
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
            {message._id == selectedMessageId &&
            isModalOpen &&
            message.type == "message" ? (
              <div
                ref={refs.setFloating}
                style={floatingStyles}
                className={cn(
                  "z-50 mt-4 pb-3 opacity-100",
                  isScreenTop ? "mt-0" : null,
                )}
              >
                <div className="rounded-sm border-2 border-secondary-foreground">
                  <div className="rounded-sm bg-secondary">
                    <div
                      onClick={() => {
                        navigator.clipboard.writeText(message.content);
                        setIsModalOpen(!isModalOpen);
                        toast.success("Copied to clipboard");
                      }}
                      className="flex cursor-pointer p-2"
                    >
                      <CopyCheck />
                      <p className="ml-1">Copy</p>
                    </div>
                    <div className="flex cursor-pointer border-y-2 border-secondary-foreground p-2 pr-8">
                      <Forward />
                      <p className="ml-1">Answer</p>
                    </div>
                    <div className="flex p-2 pr-8 text-secondary-foreground">
                      <Info />
                      <p className="ml-1">
                        Sent at {dayjs(message._creationTime).hour()}:
                        {dayjs(message._creationTime).minute() < 10
                          ? "0" + dayjs(message._creationTime).minute()
                          : dayjs(message._creationTime).minute()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
};
