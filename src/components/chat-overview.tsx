"use client";

import { Input } from "~/components/ui/input";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMediaQuery } from "react-responsive";
import { useEffect, useState } from "react";
import { type FunctionReturnType } from "convex/server";
import { NotebookText } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import Badge from "~/components/ui/badge";
import Link from "next/link";
import { cn } from "~/lib/utils";

type Chats = FunctionReturnType<typeof api.chats.getChats>;

const Chats: React.FC<{
  classNameChat?: string;
  classNameChatList?: string;
}> = ({ classNameChat, classNameChatList }) => {
  const chats = useQuery(api.chats.getChats);
  const clerkUser = useUser();
  const isLgOrLarger = useMediaQuery({ query: "(max-width: 1023px)" });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchedChats, setSearchedChats] = useState<Chats | null | undefined>(
    chats,
  );

  useEffect(() => {
    if (!searchTerm) {
      setSearchedChats(chats);
      return;
    }
    const filteredChats = chats?.filter((chat) => {
      const filteredChatUsers = (chat.users = chat.users.filter(
        (user) => user.clerkId.split("|").pop() !== clerkUser.user?.id,
      ));
      return filteredChatUsers.some((user) =>
        user.username.toLowerCase().startsWith(searchTerm.toLowerCase().trim()),
      ) ||
        (chat.support &&
          "Chat.io Support"
            .toLowerCase()
            .includes(searchTerm.toLowerCase().trim()))
        ? chat
        : !filteredChatUsers[0] &&
            !chat.support &&
            "My Notes Tool"
              .toLowerCase()
              .includes(searchTerm.toLowerCase().trim())
          ? chat
          : false;
    });

    setSearchedChats(filteredChats);
  }, [searchTerm, chats, clerkUser.user?.id]);

  return (
    <div className="mt-3 flex flex-col items-center justify-center">
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search ..."
        className={cn("w-3/4 min-w-72 lg:w-1/2 xl:w-1/3", classNameChatList)}
      />
      <div className="flex w-full justify-center">
        <div
          className={cn(
            "mt-20 flex w-full flex-col items-center truncate lg:w-1/2 xl:w-1/3",
            classNameChatList,
          )}
        >
          {searchedChats?.map((chat, index) => {
            if (chat.support) {
              return (
                <Link
                  key={index}
                  className={cn(
                    "flex w-full items-center justify-start gap-3 truncate border-t-2 border-input px-11 py-6 lg:border-0 lg:px-0",
                    classNameChat,
                  )}
                  href={`/chats/${chat._id}`}
                >
                  <Avatar className="text-white">
                    <AvatarFallback>C</AvatarFallback>
                  </Avatar>
                  <div className="truncate text-xl font-bold">
                    <p className="truncate whitespace-nowrap">Chat.io</p>
                  </div>
                  <Badge>Support</Badge>
                </Link>
              );
            }
            chat.users = chat.users.filter(
              (user) => user.clerkId.split("|").pop() !== clerkUser.user?.id,
            );

            return (
              <Link
                key={index}
                className={cn(
                  "flex w-full items-center justify-start gap-3 truncate border-t-2 border-input px-11 py-6 lg:border-0 lg:px-0",
                  classNameChat,
                )}
                href={`/chats/${chat._id}`}
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
                <div className="truncate text-xl font-bold">
                  {chat.users[0] ? (
                    <p className="truncate whitespace-nowrap">
                      {chat.users[0].username}
                    </p>
                  ) : (
                    <p className="flex">
                      <p className="truncate whitespace-nowrap">My Notes</p>
                      <Badge>Tool</Badge>
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Chats;
