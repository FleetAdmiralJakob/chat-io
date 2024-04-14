"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { NotebookText } from "lucide-react";

export function Chats() {
  const chats = useQuery(api.chats.getChats);
  const clerkUser = useUser();
  return (
    <>
      {chats?.map((chat, index) => {
        if (chat.support) {
          return (
            <div key={index} className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>C</AvatarFallback>
              </Avatar>
              Chat.io
            </div>
          );
        }
        chat.users = chat.users.filter(
          (user) => user.clerkId.split("|").pop() !== clerkUser.user?.id,
        );

        return (
          <div key={index} className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {chat.users[0] ? (
                  chat.users[0].username.slice(0, 2).toUpperCase()
                ) : (
                  <NotebookText />
                )}
              </AvatarFallback>
            </Avatar>
            {chat.users[0] ? chat.users[0].username : "My Notes"}
          </div>
        );
      })}
    </>
  );
}
