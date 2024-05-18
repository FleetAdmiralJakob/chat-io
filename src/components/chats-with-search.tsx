"use client";

import { AddUserDialog } from "~/components/homepage/add-user-dialog";
import { SignOutButton, useUser } from "@clerk/nextjs";
import Chats from "~/components/homepage/chat-overview";

const ChatsWithSearch = ({ classNameChat }: { classNameChat?: string }) => {
  const { user } = useUser();

  return (
    <div className="min-w-96 pb-24 lg:ml-24">
      <div className="relative flex h-full w-full justify-center">
        <h1 className="pt-28 text-4xl font-bold">Chats</h1>

        <AddUserDialog classNameDialogTrigger="absolute bg-input right-16 top-16" />
      </div>
      <p className="absolute top-0">
        Current User: {user ? user.username : "No user"} <br />{" "}
        <SignOutButton />
      </p>{" "}
      <br />
      <Chats classNameChat={classNameChat} />
    </div>
  );
};

export default ChatsWithSearch;
