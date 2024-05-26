"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resize";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import ChatsWithSearch from "~/components/chats-with-search";
import { Video } from "lucide-react";
import { Mic } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Phone } from "lucide-react";
import Badge from "~/components/ui/badge";
import { SendHorizontal } from "lucide-react";
import { Plus } from "lucide-react";
import { z } from "zod";
import { Ban } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Form, FormControl, FormField } from "~/components/ui/form";
import { useRef } from "react";
import { Progress } from "~/components/ui/progress";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ChevronLeft } from "lucide-react";
import { cn } from "~/lib/utils";
import { useUser } from "@clerk/nextjs";
import { Skeleton } from "~/components/ui/skeleton";
import { NotebookText } from "lucide-react";
import { useRouter } from "next/navigation";

dayjs.extend(relativeTime);

const textMessageSchema = z.object({
  message: z.string().min(1).max(4000),
});

export default function Page({ params }: { params: { chatId: string } }) {
  const [progress, setProgress] = React.useState(13);

  const router = useRouter();

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  const clerkUser = useUser();
  const sendMessage = useMutation(api.messages.createMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const messages = useQuery(api.messages.getMessages, {
    chatId: params.chatId,
  });

  const chatInfo = useQuery(api.chats.getChatInfoFromId, {
    chatId: params.chatId,
  });

  const formRef = useRef<HTMLFormElement | null>(null);

  const isLgOrLarger = useMediaQuery({ query: "(max-width: 1023px)" });
  const isScreenWidthLessThan1200 = useMediaQuery({
    query: "(max-width: 1200px)",
  });
  const is2xlOrmore = useMediaQuery({ query: "(max-width: 1537px)" });
  const maxSize = is2xlOrmore ? 50 : 60;
  const minSize = is2xlOrmore ? 45 : 30;

  const textMessageForm = useForm<z.infer<typeof textMessageSchema>>({
    resolver: zodResolver(textMessageSchema),
    defaultValues: {
      message: "",
    },
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleScroll = () => {
    if (messagesEndRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesEndRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setScrollPosition(distanceFromBottom);
    }
  };

  const scrollToBottom = (messageUser: boolean) => {
    if (messagesEndRef.current && messageUser) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    } else if (messagesEndRef.current && scrollPosition < 100) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages]);

  const [inputValue, setInputValue] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  function onTextMessageFormSubmit(values: z.infer<typeof textMessageSchema>) {
    sendMessage({ content: values.message, chatId: params.chatId });
    textMessageForm.reset();
    setInputValue("");
    scrollToBottom(true);
  }

  const [menuActive, setMenuActive] = useState(false);

  const menuClick = () => {
    setMenuActive(!menuActive);
  };

  return (
    <>
      <div className="flex h-screen flex-col">
        <ResizablePanelGroup
          className="w-full flex-grow"
          direction="horizontal"
        >
          {!isLgOrLarger ? (
            <ResizablePanel
              className="w-full"
              defaultSize={50}
              minSize={minSize}
              maxSize={maxSize}
            >
              <ChatsWithSearch classNameChat="justify-center" />
            </ResizablePanel>
          ) : null}
          <ResizableHandle />
          <ResizablePanel
            defaultSize={50}
            minSize={30}
            maxSize={70}
            className="flex flex-col"
          >
            <div className="flex h-20 w-full items-center justify-between bg-primary py-6">
              <div className="text-lg lg:hidden">
                <ChevronLeft
                  className="ml-2 mr-1"
                  onClick={() => {
                    router.back();
                  }}
                />
              </div>
              <div className="ml-1 flex w-full items-center justify-start  2xl:ml-16">
                <Avatar className="mr-0.5 text-sm text-white">
                  <AvatarFallback>
                    {chatInfo?.basicChatInfo.support ? (
                      "C"
                    ) : chatInfo?.otherUser[0] ? (
                      chatInfo.otherUser[0].username.slice(0, 2).toUpperCase()
                    ) : (
                      <NotebookText />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex">
                  <div>
                    <p className="mx-2.5 mt-1 whitespace-nowrap text-sm font-bold lg:text-lg">
                      {chatInfo?.basicChatInfo.support
                        ? "Chat.io"
                        : chatInfo?.otherUser[0]
                          ? chatInfo.otherUser[0].username.length > 13 &&
                            !isScreenWidthLessThan1200
                            ? chatInfo.otherUser[0].username
                            : chatInfo.otherUser[0].username.slice(0, 13) +
                              "..."
                          : "My Notes"}
                    </p>
                    <div className="ml-2.5 text-sm text-secondary-foreground">
                      Offline
                    </div>
                  </div>
                  <div className="mt-0.5">
                    {chatInfo?.basicChatInfo.support ? (
                      <Badge>Support</Badge>
                    ) : !chatInfo?.otherUser[0] ? (
                      <Badge>Tool</Badge>
                    ) : null}
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  "mr-1 flex cursor-pointer rounded-sm border-secondary-foreground px-2 text-sm lg:border-2 lg:bg-primary 2xl:mr-16",
                  {
                    hidden: chatInfo?.basicChatInfo.support,
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
              className="flex-grow overflow-x-auto"
              onScroll={handleScroll}
              ref={messagesEndRef}
            >
              {messages ? (
                messages.map((message) => {
                  return (
                    <>
                      <div className="flex">
                        {message.from.username == clerkUser.user?.username ? (
                          <div className="my-1 mr-4 flex w-full flex-col items-end">
                            <div className="max-w-[66.6667%] rounded-sm bg-accent p-3">
                              {message.deleted ? (
                                <div className="flex font-medium">
                                  <Ban />
                                  <p className="ml-2.5">
                                    This message was deleted
                                  </p>
                                </div>
                              ) : (
                                message.content
                              )}
                            </div>
                            <div className="mr-2 text-[75%] font-bold text-secondary-foreground">
                              Read
                            </div>
                            {!message.deleted ? (
                              <button
                                onMouseDown={() => {
                                  deleteMessage({ messageId: message._id });
                                }}
                              >
                                Delete
                              </button>
                            ) : null}
                          </div>
                        ) : (
                          <div className="my-1 ml-4 flex w-full justify-start">
                            <div className="max-w-[66.6667%] rounded-sm bg-secondary p-3">
                              {message.deleted ? (
                                <div className="flex font-medium">
                                  <Ban />
                                  <p className="ml-2.5">
                                    This message was deleted
                                  </p>
                                </div>
                              ) : (
                                message.content
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })
              ) : isLgOrLarger ? (
                <div className="flex justify-center">
                  <SkeletonMessages count={7} />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Progress value={progress} className="w-[60%]" />
                </div>
              )}
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
                    onClick={textMessageForm.handleSubmit(
                      onTextMessageFormSubmit,
                    )}
                    {...textMessageForm}
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
        {menuActive && isLgOrLarger ? <div>Test</div> : null}
      </div>
    </>
  );
}
