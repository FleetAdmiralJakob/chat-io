"use client";

import { useUser } from "@clerk/nextjs";
import Badge from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { type FunctionReturnType } from "convex/server";
import { ArrowRight, Ban, NotebookText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";

export type Chats = FunctionReturnType<typeof api.chats.getChats>;

const SkeletonsChat = (props: { amount: number }) => {
  return Array.from({ length: props.amount }).map((_, index) => (
    <div
      key={index}
      className={cn("w-full border-t-2 border-secondary", {
        "border-0": index == 0,
      })}
    >
      <div className="flex w-full items-center justify-between px-5 py-6 lg:ml-5 lg:px-0">
        <div className="flex w-full items-start justify-start gap-4">
          <Skeleton className="relative flex h-11 w-11 shrink-0 overflow-hidden rounded-full lg:h-14 lg:w-14" />

          <div className="mt-1 flex flex-col gap-2 text-xl font-bold">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <ArrowRight className="ml-3 text-secondary-foreground lg:mr-10" />
      </div>
    </div>
  ));
};

const Chats: React.FC<{
  classNameChatList?: string;
}> = ({ classNameChatList }) => {
  const chats = useQuery(api.chats.getChats);
  chats?.sort((a, b) => {
    const aLatestTime = Math.max(
      new Date(a._creationTime || 0).getTime(),
      a.lastMessage ? new Date(a.lastMessage._creationTime || 0).getTime() : 0,
    );
    const bLatestTime = Math.max(
      new Date(b._creationTime || 0).getTime(),
      b.lastMessage ? new Date(b.lastMessage._creationTime || 0).getTime() : 0,
    );

    return bLatestTime - aLatestTime;
  });
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
            "mt-20 flex w-10/12 flex-col items-center truncate rounded-lg border-2 border-secondary bg-primary lg:w-1/2 xl:w-1/3",
            classNameChatList,
          )}
        >
          {searchedChats ? (
            searchedChats.map((chat, index) => {
              if (chat.support) {
                return (
                  <div
                    className={cn("w-full border-t-2 border-secondary", {
                      "border-0": index == 0,
                    })}
                    key={index}
                  >
                    <Link
                      className="flex w-full items-center justify-between truncate px-5 py-6 lg:ml-5 lg:px-0"
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
                          <div className="ml-4 mt-0.5 text-sm text-destructive-foreground">
                            {chat.lastMessage &&
                              chat.lastMessage.type != "message" && (
                                <div className="font-semibold text-destructive-foreground">
                                  {chat.lastMessage.type === "pendingRequest"
                                    ? chat.lastMessage.clerkId
                                        .split("|")
                                        .pop() === clerkUser.user?.id
                                      ? "You've sent a request to clear the chat"
                                      : `The support has sent a request to clear the chat`
                                    : chat.lastMessage?.type ===
                                        "expiredRequest"
                                      ? chat.lastMessage.clerkId
                                          .split("|")
                                          .pop() === clerkUser.user?.id
                                        ? "Your request to clear the chat has expired"
                                        : `The support's request to clear the chat has expired`
                                      : chat.lastMessage.clerkId
                                            .split("|")
                                            .pop() === clerkUser.user?.username
                                        ? "The support has rejected your request to clear the chat"
                                        : "You have rejected the request to clear the chat"}
                                </div>
                              )}

                            {chat.lastMessage ? (
                              chat.lastMessage.type === "message" ? (
                                chat.lastMessage.content != "" ? (
                                  chat.lastMessage.readBy.some(
                                    (user) =>
                                      user.username ===
                                      clerkUser.user?.username,
                                  ) ? (
                                    chat.lastMessage.content
                                  ) : (
                                    <p className="truncate font-bold">
                                      {chat.lastMessage.content}
                                    </p>
                                  )
                                ) : (
                                  <div className="flex truncate">
                                    <Ban className="p-1 pt-0" />
                                    <p className="truncate">
                                      This message was deleted
                                    </p>
                                  </div>
                                )
                              ) : null
                            ) : (
                              "No messages yet"
                            )}
                          </div>
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
                  key={index}
                >
                  <Link
                    className={cn(
                      "flex w-full items-center justify-between truncate px-5 py-6 lg:ml-5 lg:border-0 lg:px-0",
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
                            <div className="mt-0.5 w-10/12 truncate text-sm font-normal text-destructive-foreground">
                              {chat.lastMessage &&
                                chat.lastMessage.type != "message" && (
                                  <div className="font-semibold text-destructive-foreground">
                                    {chat.lastMessage.type === "pendingRequest"
                                      ? chat.lastMessage.clerkId
                                          .split("|")
                                          .pop() === clerkUser.user?.id
                                        ? "You've sent a request to clear the chat"
                                        : `${chat.users[0].username} has sent a request to clear the chat`
                                      : chat.lastMessage?.type ===
                                          "expiredRequest"
                                        ? chat.lastMessage.clerkId
                                            .split("|")
                                            .pop() === clerkUser.user?.id
                                          ? "Your request to clear the chat has expired"
                                          : `${chat.users[0].username}'s request to clear the chat has expired`
                                        : chat.lastMessage.clerkId
                                              .split("|")
                                              .pop() ===
                                            clerkUser.user?.username
                                          ? `${chat.users[0].username} has rejected your request to clear the chat`
                                          : "You have rejected the request to clear the chat"}
                                  </div>
                                )}

                              {chat.lastMessage ? (
                                chat.lastMessage.type === "message" ? (
                                  chat.lastMessage.content != "" ? (
                                    chat.lastMessage.readBy.some(
                                      (user) =>
                                        user.username ===
                                        clerkUser.user?.username,
                                    ) ? (
                                      chat.lastMessage.content
                                    ) : (
                                      <p className="truncate font-bold">
                                        {chat.lastMessage.content}
                                      </p>
                                    )
                                  ) : (
                                    <div className="flex truncate">
                                      <Ban className="p-1 pt-0" />
                                      <p className="truncate">
                                        This message was deleted
                                      </p>
                                    </div>
                                  )
                                ) : null
                              ) : (
                                "No messages yet"
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <div className="flex">
                              <p className="truncate whitespace-nowrap text-lg">
                                My Notes
                              </p>
                              <Badge>Tool</Badge>
                            </div>
                            <div className="mt-0.5 w-10/12 truncate text-sm font-normal text-destructive-foreground">
                              {chat.lastMessage &&
                                chat.lastMessage.type != "message" && (
                                  <div className="font-semibold text-destructive-foreground">
                                    {chat.lastMessage.type === "pendingRequest"
                                      ? chat.lastMessage.clerkId
                                          .split("|")
                                          .pop() === clerkUser.user?.id
                                        ? "You've sent a request to clear the chat"
                                        : `Your notes have sent a request to clear the chat`
                                      : chat.lastMessage?.type ===
                                          "expiredRequest"
                                        ? chat.lastMessage.clerkId
                                            .split("|")
                                            .pop() === clerkUser.user?.id
                                          ? "Your request to clear the chat has expired"
                                          : `Your notes' request to clear the chat has expired`
                                        : chat.lastMessage.clerkId
                                              .split("|")
                                              .pop() ===
                                            clerkUser.user?.username
                                          ? "Your notes have rejected your request to clear the chat"
                                          : "You have rejected the request to clear the chat"}
                                  </div>
                                )}
                              {chat.lastMessage ? (
                                chat.lastMessage.type === "message" ? (
                                  chat.lastMessage.content != "" ? (
                                    chat.lastMessage.readBy.some(
                                      (user) =>
                                        user.username ===
                                        clerkUser.user?.username,
                                    ) ? (
                                      chat.lastMessage.content
                                    ) : (
                                      <p className="truncate font-bold">
                                        {chat.lastMessage.content}
                                      </p>
                                    )
                                  ) : (
                                    <div className="flex truncate">
                                      <Ban className="p-1 pt-0" />
                                      <p className="truncate">
                                        This message was deleted
                                      </p>
                                    </div>
                                  )
                                ) : null
                              ) : (
                                "No messages yet"
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex">
                      {chat.numberOfUnreadMessages > 0 && (
                        <div className="flex h-6 w-9 items-center justify-center rounded-full bg-accent p-1 text-[70%] font-medium">
                          {chat.numberOfUnreadMessages}
                        </div>
                      )}
                      <ArrowRight className="!important ml-3 h-6 w-6 text-secondary-foreground lg:mr-10" />
                    </div>
                  </Link>
                </div>
              );
            })
          ) : (
            <SkeletonsChat amount={5} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Chats;
