"use client";

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
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  ChevronDown,
  ChevronLeft,
  Mic,
  NotebookText,
  Phone,
  Plus,
  SendHorizontal,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { use, useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMediaQuery } from "react-responsive";
import { z } from "zod";
import { api } from "../../../../../convex/_generated/api";
import { type Id } from "../../../../../convex/_generated/dataModel";

dayjs.extend(relativeTime);

const textMessageSchema = z.object({
  message: z.string().min(1).max(4000),
});

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

  const handleScroll = useCallback(() => {
    if (messagesEndRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesEndRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // Consider "near bottom" if within 100px of bottom
      const nearBottom = distanceFromBottom < 100;
      setIsNearBottom(nearBottom);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTo({
        top: messagesEndRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  // Scroll handling for new messages
  useEffect(() => {
    scrollToBottom();
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

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );

  const router = useRouter();

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

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

  const is2xlOrmore = useMediaQuery({ query: "(max-width: 1537px)" });
  const maxSize = is2xlOrmore ? 50 : 60;
  const minSize = is2xlOrmore ? 45 : 30;

  const textMessageForm = useForm<z.infer<typeof textMessageSchema>>({
    resolver: zodResolver(textMessageSchema),
    defaultValues: {
      message: "",
    },
  });

  const [animationInput, setAnimationInput] = useState(true);

  const formRef = useRef<HTMLFormElement | null>(null);

  const [inputValue, setInputValue] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  async function onTextMessageFormSubmit(
    values: z.infer<typeof textMessageSchema>,
  ) {
    void sendMessage({ content: values.message, chatId: params.chatId });
    textMessageForm.reset();
    setInputValue("");
    scrollToBottom();
  }

  const createClearRequest = useMutation(api.clearRequests.createClearRequest);

  const createClearRequestHandler = (chatId: string) => async () => {
    await createClearRequest({ chatId });
  };

  const [menuActive, setMenuActive] = useState(false);

  const menuClick = () => {
    setMenuActive(!menuActive);
  };

  return (
    <main className="flex h-screen flex-col">
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
        >
          <DevMode className="top-20 z-10">
            <button onClick={createClearRequestHandler(params.chatId)}>
              Clear Chat Request
            </button>
            <p>chatId: {params.chatId}</p>
            <div onClick={() => devMode$.set(false)}>Disable dev mode</div>
          </DevMode>
          <div className="flex h-20 w-full items-center justify-between bg-primary py-6">
            <div className="text-lg lg:hidden">
              <ChevronLeft
                className="ml-2 mr-1"
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
            <div className="relative min-h-full w-full">
              {messages.data ? (
                <>
                  {messages.data.map((message, key) => (
                    <React.Fragment key={key}>
                      <Message
                        selectedMessageId={selectedMessageId}
                        setSelectedMessageId={setSelectedMessageId}
                        message={message}
                      />
                    </React.Fragment>
                  ))}
                  {!isNearBottom && messages.data.length > 0 && (
                    <div className="sticky bottom-4 w-full px-4">
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
                </>
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
          </div>

          <div className="flex h-28 w-full items-center justify-start bg-primary p-4 pb-10 lg:h-24 lg:pb-4">
            <div className="flex w-full justify-between">
              <Form {...textMessageForm}>
                <form
                  className="w-10/12"
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
                              className="ml-4 h-11 w-10/12 rounded-2xl border-2 border-secondary-foreground bg-secondary p-2 lg:h-16"
                              placeholder="Message ..."
                              value={inputValue}
                              onChange={(e) => {
                                handleChange(e);
                                field.onChange(e);
                              }}
                              ref={field.ref}
                            />
                          )}
                        />
                      </FormControl>
                    )}
                  />
                </form>
              </Form>
              <div className="flex items-center">
                <Mic
                  className={cn(
                    "mx-4 h-11 w-11 cursor-pointer rounded-sm border-2 border-secondary-foreground bg-primary p-2 lg:h-14 lg:w-14 lg:p-3",
                    { "hidden lg:flex": inputValue != "" },
                  )}
                />
                <SendHorizontal
                  onClick={(e) => {
                    setAnimationInput(!animationInput);
                    void textMessageForm.handleSubmit(onTextMessageFormSubmit)(
                      e,
                    );
                  }}
                  className={cn(
                    "mx-4 h-11 w-11 cursor-pointer rounded-sm border-2 border-secondary-foreground bg-primary p-2 lg:hidden lg:h-14 lg:w-14 lg:p-3",
                    { hidden: inputValue == "" },
                  )}
                />
                <Plus
                  className={cn(
                    "mx-4 h-11 w-11 cursor-pointer rounded-sm border-2 border-secondary-foreground bg-primary p-2 lg:h-14 lg:w-14 lg:p-3",
                    { "hidden lg:flex": inputValue != "" },
                  )}
                  onClick={menuClick}
                />
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
