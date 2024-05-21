"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resize";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import ChatsWithSearch from "~/components/chats-with-search";
import { IoMdVideocam } from "react-icons/io";
import { TiMicrophone } from "react-icons/ti";
import { Input } from "~/components/ui/input";
import { BiSolidPhoneCall } from "react-icons/bi";
import Badge from "~/components/ui/badge";
import { LuSendHorizonal } from "react-icons/lu";
import { z } from "zod";
import React, { useState } from "react";
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
import { cn } from "~/lib/utils";
import { useUser } from "@clerk/nextjs";
import { Skeleton } from "~/components/ui/skeleton";
import { NotebookText } from "lucide-react";

dayjs.extend(relativeTime);

const textMessageSchema = z.object({
  message: z.string().min(1).max(4000),
});

export default function Page({ params }: { params: { chatId: string } }) {
  const [progress, setProgress] = React.useState(13);

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  const clerkUser = useUser();
  const sendMessage = useMutation(api.messages.createMessage);
  const messages = useQuery(api.messages.getMessages, {
    chatId: params.chatId,
  });

  const chatInfo = useQuery(api.chats.getChatInfoFromId, {
    chatId: params.chatId,
  });

  const formRef = useRef<HTMLFormElement | null>(null);

  const isLgOrLarger = useMediaQuery({ query: "(max-width: 1023px)" });
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

  const [inputValue, setInputValue] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  function onTextMessageFormSubmit(values: z.infer<typeof textMessageSchema>) {
    sendMessage({ content: values.message, chatId: params.chatId });
    textMessageForm.reset();
    setInputValue("");
  }

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
              <div className="ml-3 flex w-3/12 items-center justify-around 2xl:ml-16">
                <div className="mr-2.5 rounded-full bg-black p-4 px-6 pt-4 text-xl lg:text-2xl">
                  {chatInfo?.basicChatInfo.support ? (
                    "C"
                  ) : chatInfo?.otherUser[0] ? (
                    chatInfo.otherUser[0].username.slice(0, 2).toUpperCase()
                  ) : (
                    <NotebookText />
                  )}
                </div>
                <div className="flex">
                  <p className="mx-2.5 text-xl font-bold lg:text-2xl">
                    {chatInfo?.basicChatInfo.support
                      ? "Chat.io"
                      : chatInfo?.otherUser[0]
                        ? chatInfo.otherUser[0].username
                        : "My Notes"}
                  </p>
                  <div className="mt-0.5">
                    {chatInfo?.basicChatInfo.support ? (
                      <Badge>Support</Badge>
                    ) : !chatInfo?.otherUser[0] ? (
                      <Badge>Tool</Badge>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="mr-3 flex text-xl 2xl:mr-16">
                <BiSolidPhoneCall className="mr-4 h-8 w-8 cursor-pointer rounded-full bg-secondary p-1 lg:mr-14 lg:h-12 lg:w-12 lg:p-2.5" />
                <IoMdVideocam className="h-8 w-8 cursor-pointer rounded-full bg-secondary p-1.5 lg:h-12 lg:w-12 lg:p-2.5" />
              </div>
            </div>
            <div className="flex-grow overflow-x-auto">
              {messages ? (
                messages.map((message) => {
                  return (
                    <>
                      <div
                        className={cn(
                          "my-4 flex w-full justify-center lg:justify-start lg:pl-10",
                          {
                            "lg:justify-end lg:pl-0 lg:pr-10":
                              clerkUser.user?.username == message.from.username,
                          },
                        )}
                      >
                        <div className="flex w-11/12 rounded-2xl border-2 border-secondary-foreground bg-secondary p-4 lg:w-2/3">
                          <Avatar className="text-white">
                            <AvatarFallback>
                              {message.from.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3 flex w-full flex-col">
                            <div className="flex w-full justify-between">
                              <div>
                                <span className="pr-7 font-bold">
                                  {message.from.username}
                                </span>
                              </div>
                              <span className="flex text-secondary-foreground">
                                {dayjs(message._creationTime).hour()}:
                                {dayjs(message._creationTime).minute() > 10 ? (
                                  <div></div>
                                ) : (
                                  <div>0</div>
                                )}
                                {dayjs(message._creationTime).minute()}
                              </span>
                            </div>
                            <div className="mt-1">
                              <p>{message.content}</p>
                            </div>
                          </div>
                        </div>
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
                                className="text ml-4 h-11 w-10/12 rounded-2xl bg-secondary p-2 lg:h-16"
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
                  <TiMicrophone
                    className={cn(
                      "mx-4 h-8 w-8 cursor-pointer rounded-full bg-accent p-1 lg:h-14 lg:w-14 lg:p-3",
                      { "hidden lg:flex": inputValue != "" },
                    )}
                  />
                  <LuSendHorizonal
                    onClick={textMessageForm.handleSubmit(
                      onTextMessageFormSubmit,
                    )}
                    {...textMessageForm}
                    className="mx-4 h-8 w-8 cursor-pointer rounded-full bg-accent p-1 lg:hidden lg:h-14 lg:w-14 lg:p-3"
                  />
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}
