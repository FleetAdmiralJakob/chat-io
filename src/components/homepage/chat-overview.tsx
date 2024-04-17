"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { NotebookText } from "lucide-react";
import { Check } from "lucide-react";
import { MousePointerClick } from "lucide-react";

export function Chats() {
  const chats = useQuery(api.chats.getChats);
  const clerkUser = useUser();

  return (
    <>
      <div className="flex justify-center">
        <div className="mt-20 flex w-full flex-col items-center lg:w-1/3">
          {chats?.map((chat, index) => {
            if (chat.support) {
              return (
                <>
                  <div
                    key={index}
                    className="flex w-full items-center justify-start gap-3 border-t-2 border-input py-6 pl-11 lg:mr-16 lg:border-0"
                  >
                    <Avatar className="text-white">
                      <AvatarFallback>C</AvatarFallback>
                    </Avatar>
                    <p className="text-xl font-bold">Chat.io</p>
                    <p className="flex rounded-sm bg-blue-400 p-1 pr-2 text-sm font-medium">
                      {" "}
                      <Check className="h-5" /> Support
                    </p>
                    <div className="absolute ml-60 mt-20">
                      <MousePointerClick className="mb-1 ml-6 animate-pulse" />
                      <p>Click here</p>
                    </div>
                  </div>
                </>
              );
            }
            chat.users = chat.users.filter(
              (user) => user.clerkId.split("|").pop() !== clerkUser.user?.id,
            );

            return (
              <div
                key={index}
                className="flex w-full items-center justify-start gap-3 border-t-2 border-input py-6 pl-11 lg:mr-16 lg:border-0"
              >
                <Avatar className="text-white">
                  <AvatarFallback>
                    {chat.users[0] ? (
                      chat.users[0].username.slice(0, 2).toUpperCase()
                    ) : (
                      <NotebookText />
                    )}
                  </AvatarFallback>
                </Avatar>
                <p className=" text-xl font-bold">
                  {chat.users[0] ? (
                    chat.users[0].username
                  ) : (
                    <p className="flex">
                      <p>My Notes</p>
                      <p className=" ml-2.5 flex rounded-sm bg-blue-400 p-1 pr-2 text-sm font-medium">
                        {" "}
                        <Check className="h-5" /> Tool
                      </p>
                    </p>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
