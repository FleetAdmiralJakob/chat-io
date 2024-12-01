"use client";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { autoPlacement, useFloating } from "@floating-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryWithStatus } from "~/app/convex-client-provider";
import ChatsWithSearch from "~/components/chats-with-search";
import { DevMode } from "~/components/dev-mode-info";
import { Message } from "~/components/message";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import Badge from "~/components/ui/badge";
import { Form, FormControl, FormField } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Progress } from "~/components/ui/progress";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resize";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import { devMode$ } from "~/states";
import { useMutation } from "convex/react";
import { type FunctionReturnType } from "convex/server";
import { ConvexError } from "convex/values";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  MessageSquare,
  Mic,
  NotebookText,
  Phone,
  Plus,
  SendHorizontal,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import React, { use, useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMediaQuery } from "react-responsive";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "../../../../../convex/_generated/api";
import { type Id } from "../../../../../convex/_generated/dataModel";

dayjs.extend(relativeTime);

const textMessageSchema = z.object({
  message: z.string().min(1).max(4000),
});

const EmojiPicker = ({
  showFullEmojiPicker,
  refsFullEmojiPicker,
  floatingStylesFullEmojiPicker,
  reactToMessageHandler,
  selectedMessageId,
}: {
  showFullEmojiPicker: boolean;
  refsFullEmojiPicker: {
    setFloating: (ref: HTMLElement | null) => void;
  };
  selectedMessageId: Id<"messages"> | null;
  floatingStylesFullEmojiPicker: React.CSSProperties;
  reactToMessageHandler: (messageId: Id<"messages">, emoji: string) => void;
}) => {
  if (!showFullEmojiPicker || !selectedMessageId) return null;

  return (
    <div
      ref={refsFullEmojiPicker.setFloating}
      style={floatingStylesFullEmojiPicker}
      className="z-[1000] opacity-100"
    >
      <Picker
        data={data}
        onEmojiSelect={(emoji: { native: string }) => {
          console.log(emoji);
          reactToMessageHandler(selectedMessageId, emoji.native);
        }}
      />
    </div>
  );
};

const SkeletonMessage = () => {
  return (
    <div>
      <div className="mt-5 flex items-center space-x-4 lg:ml-11">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </div>
  );
};

const SkeletonMessages = ({ count }: { count: number }) => {
  return (
    <div>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonMessage key={index} />
      ))}
    </div>
  );
};

const useScrollBehavior = (
  messages: FunctionReturnType<typeof api.messages.getMessages> | undefined,
) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const isFirstLoad = useRef(true);

  const handleScroll = useCallback(() => {
    if (messagesEndRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesEndRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // Consider "near bottom" if within 100 px of the bottom
      const nearBottom = distanceFromBottom < 100;
      setIsNearBottom(nearBottom);
    }
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTo({
        top: messagesEndRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "instant",
      });
    }
  }, []);

  // Handle initial scroll and subsequent message updates
  useEffect(() => {
    if (messages) {
      if (isFirstLoad.current) {
        scrollToBottom(false); // Instant scroll on the first load (it should be at the bottom of the messages without scrolling on the first load)
        isFirstLoad.current = false;
      } else {
        scrollToBottom(true); // Smooth scroll for new messages
      }
    }
  }, [messages, scrollToBottom]);

  return {
    messagesEndRef,
    handleScroll,
    scrollToBottom,
    isNearBottom,
  };
};

export default function Page(props: { params: Promise<{ chatId: string }> }) {
  const params = use(props.params);
  const [progress, setProgress] = React.useState(13);

  // We could change this to contain the whole message instead of just the id
  // to reduce the .find searches whenever we want to do something with the message,
  // but I leave this up for a future commit.
  const [editingMessageId, setEditingMessageId] =
    useState<Id<"messages"> | null>(null);

  // We could change this to contain the whole message instead of just the id
  // to reduce the .find searches whenever we want to do something with the message,
  // but I leave this up for a future commit.
  const [replyToMessageId, setReplyToMessageId] = useState<
    Id<"messages"> | undefined
  >(undefined);

  const [selectedMessageId, setSelectedMessageId] =
    useState<Id<"messages"> | null>(null);

  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  const posthog = usePostHog();

  const sendMessage = useMutation(
    api.messages.createMessage,
  ).withOptimisticUpdate((localStore, args) => {
    const chatId: Id<"privateChats"> = args.chatId as Id<"privateChats">;
    const content = args.content;

    const existingMessages = localStore.getQuery(api.messages.getMessages, {
      chatId,
    });
    const existingChats = localStore.getQuery(api.chats.getChats);
    // If we've loaded the api.messages.getMessages and api.chats.getChats query, push an optimistic message
    // onto the lists.
    if (existingMessages !== undefined && existingChats && userInfo.data) {
      const replyTo = existingMessages?.find(
        (msg) => msg._id === args.replyToId,
      );
      const now = Date.now();
      const newMessage: NonNullable<
        FunctionReturnType<typeof api.messages.getMessages>
      >[number] = {
        userId: undefined,
        _id: crypto.randomUUID() as Id<"messages">,
        _creationTime: now,
        content,
        deleted: false,
        type: "message",
        privateChatId: chatId,
        from: userInfo.data,
        readBy: [userInfo.data],
        sent: false,
        modified: false,
        replyTo:
          existingMessages && args.replyToId && replyTo?.type === "message"
            ? { ...replyTo, replyTo: undefined }
            : null,
        reactions: [],
      };
      localStore.setQuery(api.messages.getMessages, { chatId }, [
        ...(Array.isArray(existingMessages) ? existingMessages : []),
        newMessage,
      ]);
      localStore.setQuery(
        api.chats.getChats,
        {},
        existingChats.map((chat) => {
          if (chat._id === chatId) {
            return {
              ...chat,
              lastMessage: {
                ...newMessage,
                userId: userInfo.data!._id,
                replyTo: undefined,
              },
            };
          } else {
            return chat;
          }
        }),
      );
    }
  });

  const editMessage = useMutation(
    api.messages.editMessage,
  ).withOptimisticUpdate((localStore, args) => {
    const chatId: Id<"privateChats"> = params.chatId as Id<"privateChats">;
    const { newContent, messageId } = args;

    const existingMessages = localStore.getQuery(api.messages.getMessages, {
      chatId,
    });
    const existingChats = localStore.getQuery(api.chats.getChats);
    // If we've loaded the api.messages.getMessages and api.chats.getChats query, push an optimistic message
    // onto the lists.
    if (!existingMessages || !existingChats) return;

    localStore.setQuery(
      api.messages.getMessages,
      { chatId },
      existingMessages.map((message) => {
        if (message.type === "message" && message._id === messageId) {
          return {
            ...message,
            content: newContent,
            modified: true,
            modifiedAt: Date.now().toString(),
          };
        } else {
          return message;
        }
      }),
    );

    const lastMessage = existingChats.find(
      (chat) => chat._id === chatId,
    )?.lastMessage;

    if (lastMessage?._id === messageId && lastMessage.type === "message") {
      localStore.setQuery(
        api.chats.getChats,
        {},
        existingChats.map((chat) => {
          if (chat._id === chatId) {
            return {
              ...chat,
              lastMessage: {
                ...lastMessage,
                content: newContent,
                modified: true,
                modifiedAt: Date.now().toString(),
              },
            };
          } else {
            return chat;
          }
        }),
      );
    }
  });

  const userInfo = useQueryWithStatus(api.users.getUserData, {});

  const messages = useQueryWithStatus(api.messages.getMessages, {
    chatId: params.chatId,
  });

  const chatInfo = useQueryWithStatus(api.chats.getChatInfoFromId, {
    chatId: params.chatId,
  });

  const { messagesEndRef, handleScroll, scrollToBottom, isNearBottom } =
    useScrollBehavior(messages.data);

  useEffect(() => {
    if (
      userInfo.error?.message.includes("UNAUTHORIZED REQUEST") ||
      messages.error?.message.includes("UNAUTHORIZED REQUEST") ||
      chatInfo.error?.message.includes("UNAUTHORIZED REQUEST")
    ) {
      router.push("/chats");
    }
  }, [userInfo, messages, chatInfo, router]);

  const is2xlOrMore = useMediaQuery({ query: "(max-width: 1537px)" });
  const maxSize = is2xlOrMore ? 50 : 60;
  const minSize = is2xlOrMore ? 45 : 30;

  const textMessageForm = useForm<z.infer<typeof textMessageSchema>>({
    resolver: zodResolver(textMessageSchema),
    defaultValues: {
      message: "",
    },
  });

  const [animationInput, setAnimationInput] = useState(true);

  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [inputValue, setInputValue] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const fullyResetInput = () => {
    setEditingMessageId(null);
    setReplyToMessageId(undefined);
    textMessageForm.reset();
    setInputValue("");
  };

  useEffect(() => {
    if (editingMessageId) {
      const message = messages.data?.find((message) => {
        return message._id === editingMessageId;
      });
      if (message && message.type === "message") {
        setReplyToMessageId(undefined);
        setInputValue(message.content);
        inputRef.current?.focus();
      } else {
        console.error("Message not found");
      }
    }
  }, [editingMessageId, messages.data]);

  const editingMessageIdRef = useRef(editingMessageId);

  useEffect(() => {
    editingMessageIdRef.current = editingMessageId;
  }, [editingMessageId]);

  useEffect(() => {
    if (replyToMessageId) {
      if (editingMessageIdRef.current) {
        setEditingMessageId(null);
        setInputValue("");
      }
      inputRef.current?.focus();
    }
  }, [replyToMessageId]);

  async function onTextMessageFormSubmit(
    values: z.infer<typeof textMessageSchema>,
  ) {
    const trimmedMessage = values.message.trim();
    if (!trimmedMessage) return;

    if (editingMessageId) {
      const message = messages.data?.find((message) => {
        return message._id === editingMessageId;
      });

      if (message?.type === "message" && message.content !== trimmedMessage) {
        void editMessage({
          newContent: trimmedMessage,
          messageId: editingMessageId,
        });
        posthog.capture("message_edited");
      }
    } else {
      void sendMessage({
        content: trimmedMessage,
        chatId: params.chatId,
        replyToId: replyToMessageId,
      });
      posthog.capture("message_sent");
    }

    fullyResetInput();
    scrollToBottom();
  }

  const createClearRequest = useMutation(api.clearRequests.createClearRequest);

  const createClearRequestHandler = (chatId: string) => async () => {
    try {
      await createClearRequest({ chatId });
    } catch (error) {
      console.error("Failed to create clear chat request:", {
        error,
        chatId,
      });

      if (error instanceof ConvexError) {
        type ConvexErrorData = { errorCode: string };
        const errorData = error.data as ConvexErrorData;

        if (errorData.errorCode === "ALREADY_OPEN_REQUEST") {
          toast.error("A request to clear this chat is already pending");
        } else {
          toast.error(
            "Failed to create clear chat request. Please try again later.",
          );
        }
      } else {
        toast.error("An unexpected error occurred. Please try again later.");
      }
    }
  };

  const [menuActive, setMenuActive] = useState(false);

  const menuClick = () => {
    setMenuActive(!menuActive);
  };

  const [showFullEmojiPicker, setShowFullEmojiPicker] = useState(false);

  const [isInBottomHalf, setIsInBottomHalf] = useState<boolean | null>(null);

  const {
    refs: refsFullEmojiPicker,
    floatingStyles: floatingStylesFullEmojiPicker,
  } = useFloating({
    middleware: [autoPlacement({ padding: 4 })],
  });

  const reactToMessage = useMutation(
    api.messages.reactToMessage,
  ).withOptimisticUpdate((localStore, args) => {
    const messageId = args.messageId;
    const emoji = args.reaction;

    if (!userInfo.data) return;

    const reaction = {
      _id: crypto.randomUUID() as Id<"reactions">,
      _creationTime: Date.now(),
      messageId,
      userId: userInfo.data._id,
      emoji,
      userInfo,
    };

    const existingMessages = localStore.getQuery(api.messages.getMessages, {
      chatId: params.chatId,
    });

    if (existingMessages) {
      localStore.setQuery(
        api.messages.getMessages,
        { chatId: params.chatId },
        existingMessages.map((message) =>
          message._id === messageId && message.type === "message"
            ? {
                ...message,
                reactions: message.reactions?.find(
                  // Check if user already reacted with same emoji
                  (reaction) =>
                    reaction.userId === userInfo.data?._id &&
                    reaction.emoji === emoji,
                )
                  ? // If same reaction exists, remove it (toggling off)
                    message.reactions.filter(
                      (reaction) =>
                        !(
                          reaction.userId === userInfo.data?._id &&
                          reaction.emoji === emoji
                        ),
                    )
                  : // If user has different reaction, update it
                    message.reactions?.find(
                        (reaction) => reaction.userId === userInfo.data?._id,
                      )
                    ? message.reactions.map((reaction) =>
                        reaction.userId === userInfo.data?._id
                          ? { ...reaction, emoji }
                          : reaction,
                      )
                    : // If no existing reaction, add new one
                      [...(message.reactions || []), reaction],
              }
            : message,
        ),
      );
    }
  });

  const reactToMessageHandler = (messageId: Id<"messages">, emoji: string) => {
    void reactToMessage({ messageId, reaction: emoji });
    setSelectedMessageId(null);
    setShowFullEmojiPicker(false);
  };

  return (
    <main className="flex h-screen flex-col">
      {selectedMessageId ? (
        <div
          onClick={() => {
            setSelectedMessageId(null);
            setShowFullEmojiPicker(false);
          }}
          className="fixed inset-0 z-50 bg-black opacity-75"
        ></div>
      ) : null}
      <ResizablePanelGroup className="w-full flex-grow" direction="horizontal">
        <ResizablePanel
          className="hidden w-full lg:block"
          defaultSize={50}
          minSize={minSize}
          maxSize={maxSize}
        >
          <div className="min-w-96 pb-24">
            <div className="relative flex h-full w-full justify-center">
              <div className="h-screen w-full overflow-y-auto">
                <ChatsWithSearch classNameChatList="xl:w-1/2" />
              </div>
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          defaultSize={50}
          minSize={30}
          maxSize={70}
          className="relative flex flex-col"
          id="resizable-panel-chat"
        >
          <EmojiPicker
            {...{
              showFullEmojiPicker,
              refsFullEmojiPicker,
              floatingStylesFullEmojiPicker,
              reactToMessageHandler,
              selectedMessageId,
            }}
          />
          <DevMode className="top-20 z-10">
            <button onClick={createClearRequestHandler(params.chatId)}>
              Clear Chat Request
            </button>
            <p>chatId: {params.chatId}</p>
            <div onClick={() => devMode$.set(false)}>Disable dev mode</div>
          </DevMode>
          <div className="flex h-20 w-full items-center justify-between bg-primary py-6 lg:px-3">
            <div className="text-lg lg:hidden">
              <ChevronLeft
                className="ml-2 mr-1 cursor-pointer"
                onClick={() => {
                  router.back();
                }}
              />
            </div>
            <div className="ml-1 flex w-full items-center justify-start overflow-hidden 2xl:ml-16">
              <Avatar className="mr-0.5 text-sm text-white">
                <AvatarFallback>
                  {chatInfo.data ? (
                    chatInfo.data.basicChatInfo.support ? (
                      "C"
                    ) : chatInfo.data.otherUser[0] ? (
                      chatInfo.data.otherUser[0].username
                        .slice(0, 2)
                        .toUpperCase()
                    ) : (
                      <NotebookText />
                    )
                  ) : (
                    <Skeleton className="h-full w-full"></Skeleton>
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex truncate">
                <div className="mx-2.5 flex flex-col gap-1 truncate">
                  <div className="truncate text-sm font-bold lg:text-lg">
                    {chatInfo.data ? (
                      chatInfo.data.basicChatInfo.support ? (
                        "Chat.io"
                      ) : chatInfo.data.otherUser[0] ? (
                        chatInfo.data.otherUser[0].username
                      ) : (
                        "My Notes"
                      )
                    ) : (
                      <Skeleton className="h-5 w-32"></Skeleton>
                    )}
                  </div>
                  <div className="text-sm text-destructive-foreground">
                    {chatInfo.data ? (
                      "Offline"
                    ) : (
                      <Skeleton className="h-5 w-16"></Skeleton>
                    )}
                  </div>
                </div>
                <div className="mt-0.5">
                  {chatInfo.data ? (
                    chatInfo.data.basicChatInfo.support ? (
                      <Badge>Support</Badge>
                    ) : !chatInfo.data?.otherUser[0] ? (
                      <Badge>Tool</Badge>
                    ) : null
                  ) : null}
                </div>
              </div>
            </div>
            <div
              className={cn(
                "mr-1 flex cursor-pointer rounded-sm border-secondary-foreground px-2 text-sm lg:border-2 lg:bg-primary 2xl:mr-16",
                {
                  hidden: chatInfo.data?.basicChatInfo.support,
                },
              )}
            >
              <div className="h-10 rounded-sm border-2 border-secondary-foreground lg:h-12 lg:rounded-none lg:border-0 lg:border-r-2">
                <Phone className="mx-1.5 mt-1.5 lg:mx-0 lg:ml-2 lg:mr-4 lg:mt-3" />
              </div>

              <div className="ml-3 h-10 rounded-sm border-2 border-secondary-foreground lg:ml-0 lg:h-12 lg:border-0">
                <Video className="mx-1.5 mt-1.5 lg:mx-0 lg:ml-4 lg:mr-2 lg:mt-3" />
              </div>
            </div>
          </div>
          <div
            className="relative h-full flex-grow overflow-x-hidden"
            onScroll={handleScroll}
            ref={messagesEndRef}
          >
            {messages.data ? (
              <div className="relative w-full p-3">
                <div className="mb-8 flex w-full flex-col items-center justify-center gap-4 space-y-4 rounded-lg bg-secondary p-6 text-center shadow-lg">
                  <div className="flex items-center justify-center gap-4 space-x-2 text-destructive-foreground dark:text-accent-foreground">
                    <NotebookText className="h-6 w-6" />
                    <span className="text-xl font-semibold">
                      Let the Conversation Begin!
                    </span>
                    <NotebookText className="h-6 w-6" />
                  </div>
                  <p className="text-md text-destructive-foreground dark:text-accent-foreground">
                    This is the beginning of an amazing chat. Share ideas,
                    express yourself, and connect!
                  </p>
                  <div className="flex space-x-4 text-destructive-foreground">
                    <SendHorizontal className="h-5 w-5 animate-pulse" />
                    <MessageSquare className="h-5 w-5 animate-pulse delay-500" />
                    <Sparkles className="h-5 w-5 animate-pulse delay-1000" />
                  </div>
                </div>
                {messages.data.map((message, key) => (
                  <React.Fragment key={key}>
                    <Message
                      selectedMessageId={selectedMessageId}
                      setSelectedMessageId={setSelectedMessageId}
                      reactToMessageHandler={reactToMessageHandler}
                      setEditingMessageId={setEditingMessageId}
                      setReplyToMessageId={setReplyToMessageId}
                      message={message}
                      userInfos={[userInfo.data, chatInfo.data?.otherUser]}
                      refsFullEmojiPicker={refsFullEmojiPicker}
                      setShowFullEmojiPicker={setShowFullEmojiPicker}
                      isInBottomHalf={isInBottomHalf}
                      setIsInBottomHalf={setIsInBottomHalf}
                    />
                  </React.Fragment>
                ))}
                {!isNearBottom && messages.data.length > 0 && (
                  <div className="sticky bottom-4 z-40 w-full px-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() => scrollToBottom()}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg hover:bg-accent"
                        aria-label="Scroll to bottom"
                      >
                        <ChevronDown className="h-6 w-6 text-destructive-foreground" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex justify-center lg:hidden">
                  <SkeletonMessages count={10} />
                </div>
                <div className="hidden h-full w-full items-center justify-center lg:flex">
                  <Progress value={progress} className="w-[60%]" />
                </div>
              </>
            )}
          </div>

          <div className="flex w-full items-center justify-start">
            <div className="flex w-full flex-col gap-2">
              <AnimatePresence>
                {replyToMessageId && (
                  <motion.div
                    initial={{ opacity: 0, translateY: 70 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    exit={{ opacity: 0, translateY: 70 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="relative m-4 mb-2 rounded-lg border border-secondary-foreground bg-secondary p-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-destructive-foreground">
                          Replying to:
                        </p>
                      </div>
                      <button
                        className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 transform cursor-pointer items-center justify-center rounded-sm border-2 border-secondary-foreground bg-primary p-1 lg:h-10 lg:w-10 lg:p-2"
                        onClick={() => setReplyToMessageId(undefined)}
                        aria-label="Cancel reply"
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setReplyToMessageId(undefined);
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </button>

                      <p className="text-sm">
                        {(() => {
                          const message = messages.data?.find(
                            (msg) => msg._id === replyToMessageId,
                          );
                          return message?.type === "message" ? (
                            <>
                              <strong>{message.from.username}</strong>:{" "}
                              {message.content}
                            </>
                          ) : null;
                        })()}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="z-10 flex w-full justify-between gap-8 bg-primary p-4 pb-10 lg:pb-4">
                <Form {...textMessageForm}>
                  <form
                    className="w-full"
                    ref={formRef}
                    onSubmit={textMessageForm.handleSubmit(
                      onTextMessageFormSubmit,
                    )}
                  >
                    <FormField
                      control={textMessageForm.control}
                      name="message"
                      render={() => (
                        <FormControl>
                          <Controller
                            name="message"
                            control={textMessageForm.control}
                            render={({ field }) => (
                              <Input
                                className="h-11 w-full rounded-2xl border-2 border-secondary-foreground bg-secondary p-2 lg:h-16"
                                placeholder="Message ..."
                                value={inputValue}
                                onChange={(e) => {
                                  handleChange(e);
                                  field.onChange(e);
                                }}
                                aria-label="Message input"
                                aria-describedby={
                                  replyToMessageId ? "reply-context" : undefined
                                }
                                ref={(e) => {
                                  field.ref(e);
                                  inputRef.current = e;
                                }}
                              />
                            )}
                          />
                        </FormControl>
                      )}
                    />
                  </form>
                </Form>
                <div className="flex items-center gap-8">
                  <Mic
                    className={cn(
                      "h-11 w-11 cursor-pointer rounded-sm border-2 border-secondary-foreground bg-primary p-2 lg:h-14 lg:w-14 lg:p-3",
                      { hidden: inputValue !== "" },
                    )}
                  />

                  <X
                    className={cn(
                      "h-11 w-11 cursor-pointer rounded-sm border-2 border-secondary-foreground bg-primary p-2 lg:h-14 lg:w-14 lg:p-3",
                      { hidden: editingMessageId === null },
                    )}
                    onClick={() => {
                      fullyResetInput();
                    }}
                  />

                  <SendHorizontal
                    onClick={(e) => {
                      setAnimationInput(!animationInput);
                      void textMessageForm.handleSubmit(
                        onTextMessageFormSubmit,
                      )(e);
                    }}
                    className={cn(
                      "h-11 w-11 cursor-pointer rounded-sm border-2 border-secondary-foreground bg-primary p-2 lg:h-14 lg:w-14 lg:p-3",
                      { hidden: inputValue === "" },
                    )}
                  />

                  <Plus
                    className={cn(
                      "h-11 w-11 cursor-pointer rounded-sm border-2 border-secondary-foreground bg-primary p-2 lg:h-14 lg:w-14 lg:p-3",
                      { hidden: inputValue !== "" },
                    )}
                    onClick={menuClick}
                  />
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
