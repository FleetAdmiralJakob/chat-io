"use client";

import { Input } from "~/components/ui/input";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import Badge from "~/components/ui/badge";
import { NotebookText } from "lucide-react";

interface User {
  clerkId: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

interface Chat {
  users: User[];
  // other properties of chat
}

const Chats: React.FC = () => {
  const chats = useQuery(api.chats.getChats);
  const clerkUser = useUser();
  const [searchTerm, setSearchTerm] = useState("");

  // Filterfunktion für Benutzer basierend auf clerkId
  // Filterfunktion für Benutzer basierend auf clerkId
  const predefinedUsers: User[] = [
    { clerkId: "support", username: "Chat.io" },
    { clerkId: "mynotes", username: "My Notes" },
  ];

  const filterUsers = (users: User[]) => {
    // Annahme: clerkUser.user?.id ist die ID des aktuellen Benutzers
    const usersFilter = users.filter(
      (user) => user.clerkId.split("|").pop() !== clerkUser.user?.id,
    );

    // Zusammenführen der vordefinierten Benutzer mit den gefilterten Benutzern
    const mergedUsers = [...usersFilter, ...predefinedUsers];

    return mergedUsers;
  };

  // Filter function for users based on search term
  const searchUsers = (users: User[]) => {
    return users.filter((user) =>
      user.username.toLowerCase().startsWith(searchTerm.toLowerCase()),
    );
  };

  const allUsers: User[] =
    chats?.reduce(
      (users: User[], chat: Chat) => [...users, ...chat.users],
      [],
    ) ?? [];

  // Filtern und Suchen Sie die Benutzer
  const filteredUsers = filterUsers(allUsers);
  const searchedUsers = searchUsers(filteredUsers);

  return (
    <div className="mt-3 flex flex-col items-center justify-center">
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search ..."
        className="w-3/4 lg:w-1/2 xl:w-1/3"
      />
      <div className="mt-14 w-full lg:w-5/12">
        {searchedUsers.map((user, userIndex) => (
          <div
            key={userIndex}
            className="flex w-full items-center justify-start gap-3 border-t-2 border-input py-6 pl-11 lg:border-0"
          >
            <Avatar className="text-white">
              <AvatarFallback>
                {user.username === "Chat.io" ? (
                  "C"
                ) : user.username === "My Notes" ? (
                  <NotebookText />
                ) : (
                  user.username.substring(0, 2).toUpperCase()
                )}
              </AvatarFallback>
            </Avatar>
            <p className=" text-xl font-bold">
              {user.username ? (
                user.username
              ) : (
                <p className="flex">
                  <p>My Notes</p>
                  <Badge>Tool</Badge>
                </p>
              )}
            </p>
            {user.username === "Chat.io" ? (
              <Badge>Support</Badge>
            ) : user.username === "My Notes" ? (
              <Badge>Tool</Badge>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Chats;
