"use client";

import { Input } from "~/components/ui/input";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { type FunctionReturnType } from "convex/server";
import { NotebookText } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Ban } from "lucide-react";
import { ArrowRight } from "lucide-react";
import Badge from "~/components/ui/badge";
import Link from "next/link";
import { cn } from "~/lib/utils";

type Chats = FunctionReturnType<typeof api.chats.getChats>;

const Chats: React.FC<{
  classNameChatList?: string;
}> = ({ classNameChatList }) => {
  const chats = useQuery(api.chats.getChats);
  const clerkUser = useUser();
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
      <div className="mb-4 flex w-full justify-center">
        <div
          className={cn(
            "mt-20 flex w-11/12 flex-col items-center truncate rounded-lg border-2 border-secondary bg-primary lg:w-1/2 xl:w-1/3",
            classNameChatList,
          )}
        >
          {searchedChats?.map((chat, index) => {
            if (chat.support) {
              return (
                <div
                  className={cn("w-full border-t-2 border-secondary", {
                    "border-0": index == 0,
                  })}
                >
                  <Link
                    key={index}
                    className={cn(
                      "flex w-full items-center justify-between truncate px-5 py-6 lg:ml-5 lg:px-0",
                    )}
                    href={`/chats/${chat._id}`}
                  >
                    <div className="flex w-full items-start justify-start truncate">
                      <Avatar className="text-white">
                        <AvatarFallback>C</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col truncate">
                        <div className="flex">
                          <div className="truncate text-xl font-bold">
                            <p className="ml-4 truncate whitespace-nowrap">
                              Chat.io
                            </p>
                          </div>
                          <Badge>Support</Badge>
                        </div>
                        <p className="ml-4 mt-0.5 text-sm text-destructive-foreground">
                          {chat.lastMessage.content != "" ? (
                            chat.lastMessage.content != undefined ? (
                              chat.lastMessage.readBy.some(
                                (user) =>
                                  user.username === clerkUser.user?.username,
                              ) ? (
                                chat.lastMessage?.content
                              ) : (
                                <p className="truncate font-bold">
                                  {chat.lastMessage?.content}
                                </p>
                              )
                            ) : (
                              "No messages yet"
                            )
                          ) : (
                            <div className="flex truncate">
                              <Ban className="p-1 pt-0" />
                              <p className="truncate">
                                This message was deleted
                              </p>
                            </div>
                          )}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="ml-3 text-secondary-foreground lg:mr-10" />
                  </Link>
                </div>
              );
            }
            chat.users = chat.users.filter(
              (user) => user.clerkId.split("|").pop() !== clerkUser.user?.id,
            );

            return (
              <div
                className={cn("w-full border-t-2 border-secondary", {
                  "border-0": index == 0,
                })}
              >
                <Link
                  key={index}
                  className={cn(
                    "flex w-full items-center justify-between truncate border-t-2 border-input px-5 py-6 lg:ml-5 lg:border-0 lg:px-0",
                  )}
                  href={`/chats/${chat._id}`}
                >
                  <div className="flex w-full truncate">
                    <Avatar className="text-white">
                      <AvatarFallback>
                        {chat.users[0] ? (
                          chat.users[0].username.slice(0, 2).toUpperCase()
                        ) : (
                          <NotebookText />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-4 truncate text-xl font-bold">
                      {chat.users[0] ? (
                        <div className="truncate whitespace-nowrap">
                          <p className="truncate text-lg">
                            {chat.users[0].username}
                          </p>
                          <p
                            className={cn(
                              "mt-0.5 w-10/12 truncate text-sm font-normal text-destructive-foreground",
                              { "w-full": chat.lastMessage.content == "" },
                            )}
                          >
                            {chat.lastMessage.content != "" ? (
                              chat.lastMessage.content != undefined ? (
                                chat.lastMessage.readBy.some(
                                  (user) =>
                                    user.username === clerkUser.user?.username,
                                ) ? (
                                  chat.lastMessage?.content
                                ) : (
                                  <p className="truncate font-bold">
                                    {chat.lastMessage?.content}
                                  </p>
                                )
                              ) : (
                                "No messages yet"
                              )
                            ) : (
                              <div className="flex truncate">
                                <Ban className="p-1 pt-0" />
                                <p className="truncate">
                                  This message was deleted
                                </p>
                              </div>
                            )}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <div className="flex">
                            <p className="truncate whitespace-nowrap text-lg">
                              My Notes
                            </p>
                            <Badge>Tool</Badge>
                          </div>
                          <p className="mt-0.5 w-10/12 truncate text-sm font-normal text-destructive-foreground">
                            {chat.lastMessage.content != "" ? (
                              chat.lastMessage.content != undefined ? (
                                chat.lastMessage.readBy.some(
                                  (user) =>
                                    user.username === clerkUser.user?.username,
                                ) ? (
                                  chat.lastMessage?.content
                                ) : (
                                  <p className="truncate font-bold">
                                    {chat.lastMessage?.content}
                                  </p>
                                )
                              ) : (
                                "No messages yet"
                              )
                            ) : (
                              <div className="flex truncate">
                                <Ban className="p-1 pt-0" />
                                <p className="truncate">
                                  This message was deleted
                                </p>
                              </div>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex">
                    {chat.lastMessage.content != "" ? (
                      chat.lastMessage.content != undefined ? (
                        chat.lastMessage.readBy.some(
                          (user) => user.username === clerkUser.user?.username,
                        ) ? (
                          ""
                        ) : (
                          <div className="flex h-6 w-9 items-center justify-center rounded-full bg-accent p-1 text-[70%] font-medium">
                            {chat.numberOfUnreadMessages}
                          </div>
                        )
                      ) : (
                        ""
                      )
                    ) : (
                      ""
                    )}
                    <ArrowRight className="!important ml-3 h-6 w-6 text-secondary-foreground lg:mr-10" />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Chats;
