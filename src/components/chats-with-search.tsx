"use client";

import { AddUserDialog } from "~/components/add-user-dialog";
import { SignOutButton, useUser } from "@clerk/nextjs";
import Chats from "~/components/chat-overview";
import { devMode$ } from "~/states";
import { useState } from "react";
import { DevMode } from "~/components/dev-mode-info";

const ChatsWithSearch = ({
  classNameChatList,
}: {
  classNameChatList?: string;
}) => {
  const { user } = useUser();
  const [devModeClick, setDevModeClick] = useState<number>(0);

  return (
    <div className="min-w-96 pb-24 lg:ml-24">
      <div className="relative flex h-full w-full justify-center">
        <h1
          className="pt-28 text-4xl font-bold"
          onClick={() => {
            setDevModeClick((prevState) => prevState + 1);

            if (devModeClick >= 9) {
              devMode$.set(true);
            }
          }}
        >
          Chats
        </h1>

        <AddUserDialog classNameDialogTrigger="absolute bg-input border-2 border-secondary right-12 top-12" />
      </div>
      <DevMode className="lg:left-24">
        Current User: {user ? user.username : "No user"} <br />{" "}
        <div onClick={() => devMode$.set(false)}>Disable dev mode</div>
        <SignOutButton />
      </DevMode>{" "}
      <br />
      <Chats classNameChatList={classNameChatList} />
    </div>
  );
};

export default ChatsWithSearch;
