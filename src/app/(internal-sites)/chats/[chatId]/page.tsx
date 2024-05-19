"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resize";
import ChatsWithSearch from "~/components/chats-with-search";
import { IoMdVideocam } from "react-icons/io";
import { TiMicrophone } from "react-icons/ti";
import { Input } from "~/components/ui/input";
import { BiSolidPhoneCall } from "react-icons/bi";
import Badge from "~/components/ui/badge";
import { z } from "zod";
import React from "react";
import { useMediaQuery } from "react-responsive";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Form, FormControl, FormField } from "~/components/ui/form";
import { useRef } from "react";

const textMessageSchema = z.object({
  message: z.string().min(1).max(4000),
});

export default function Page({ params }: { params: { chatId: string } }) {
  const sendMessage = useMutation(api.messages.createMessage);

  const messages = useQuery(api.messages.getMessages, {
    chatId: params.chatId,
  });

  const formRef = useRef<HTMLFormElement | null>(null);

  const otherUser = "Chat.io";

  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const isLgOrLarger = useMediaQuery({ query: "(max-width: 1023px)" });

  const textMessageForm = useForm<z.infer<typeof textMessageSchema>>({
    resolver: zodResolver(textMessageSchema),
    defaultValues: {
      message: "",
    },
  });

  function onTextMessageFormSubmit(values: z.infer<typeof textMessageSchema>) {
    sendMessage({ content: values.message, chatId: params.chatId });
    textMessageForm.reset();
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
              minSize={30}
              maxSize={70}
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
            <p className="absolute bottom-20">ChatID: {params.chatId}</p>
            <div className="flex h-20 w-full items-center justify-between bg-primary">
              <div className="ml-16 flex w-3/12 items-center justify-around">
                <div className="mr-2.5 rounded-full bg-black p-4 px-6 pt-4 text-2xl">
                  {otherUser.charAt(0).toUpperCase()}
                </div>
                <div className="flex">
                  <p className="mx-2.5 text-2xl font-bold">{otherUser}</p>
                  <div className="mt-0.5">
                    <Badge>Support</Badge>
                  </div>
                </div>
              </div>
              <div className="mr-16 flex text-xl">
                <BiSolidPhoneCall className="mr-14 h-12 w-12 cursor-pointer rounded-full bg-secondary p-2.5" />
                <IoMdVideocam className="h-12 w-12 cursor-pointer rounded-full bg-secondary p-2.5" />
              </div>
            </div>
            <div className="flex-grow">
              {messages
                ? messages.map((message) => {
                    return (
                      <>
                        {message.from.username}
                        {message.content} <br /> <br />
                      </>
                    );
                  })
                : "Loading..."}
            </div>
            <div className="flex h-20 w-full items-center justify-start bg-primary p-4">
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
                      render={({ field }) => (
                        <FormControl>
                          <Input
                            className="ml-4 w-full bg-secondary p-2"
                            placeholder="Message ..."
                            {...field}
                          />
                        </FormControl>
                      )}
                    />
                  </form>
                </Form>
                <div>
                  <TiMicrophone className="mx-4 h-14 w-14 cursor-pointer rounded-full bg-accent p-3" />
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}
