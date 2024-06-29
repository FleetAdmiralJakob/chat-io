"use client";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {ArrowRight, Lock} from "lucide-react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { SendHorizontal } from "lucide-react";
import { Settings } from "lucide-react";
import { UsersRound } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import {cn} from "~/lib/utils";

interface settingsCard {
  title: string;
  icon?: JSX.Element;
}

export default function Profile() {
  const clerkUser = useUser();
  const username = clerkUser.user ? clerkUser.user.username || "" : "";

  const settings: settingsCard[] = [
    { title: username },
    { title: "Settings", icon: <Settings /> },
    { title: "Notification", icon: <Bell /> },
    { title: "Privacy", icon: <Lock /> },
    { title: "Chats", icon: <SendHorizontal /> },
    { title: "Contributors", icon: <UsersRound /> },
  ];

  return (
    <main className="mt-7 flex h-screen flex-col items-center lg:mt-0 lg:justify-around lg:pl-24">
      <div className="flex flex-col items-center">
        <p className="my-10 text-xl font-bold sm:text-2xl">Profile</p>
      </div>
      <div className="flex w-full flex-col items-center justify-center">
        <div className="mb-8 flex w-11/12 flex-col items-center justify-center rounded-xl border-2 border-secondary lg:w-2/3 xl:w-1/3">
          {settings.map((item) => {
            if (item.title == username) {
              return (
                <div className="flex w-full cursor-pointer rounded-lg bg-primary p-6 text-xl sm:text-2xl xl:text-lg">
                  <div className="mr-5 flex h-10 w-10 items-center justify-center rounded-3xl bg-background text-sm font-medium text-destructive-foreground">
                    {item.title.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="pt-2 font-semibold text-destructive-foreground">
                    {item.title}
                  </p>
                </div>
              );
            }
          })}
        </div>
        <div className="flex w-11/12 flex-col items-center justify-center rounded-xl border-2 border-secondary lg:w-2/3 xl:w-1/3">
          {settings.map((item) => {
            if (item.title == username || item.title == "Contributors") {
              return;
            }
            return (
              <Link
                key={item.title}
                href={`/profile/${item.title.toLowerCase()}`}
                className={cn(
                  "flex w-full cursor-pointer justify-between border-t-2 border-secondary bg-primary p-6 text-xl sm:text-2xl xl:text-lg",
                  {
                    "rounded-t-lg border-t-0": item.title == "Settings",
                    "rounded-b-lg": item.title == "Chats",
                  },
                )}
              >
                <div className="flex">
                  <div className="mr-5 flex h-10 w-10 items-center justify-center rounded-3xl bg-secondary text-sm font-medium text-destructive-foreground">
                    {item.icon}
                  </div>
                  <p className="flex items-center font-semibold text-destructive-foreground">
                    {item.title}
                  </p>
                </div>
                <div className="flex items-center">
                  <ArrowRight className="ml-3 flex text-secondary-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mb-4 mt-8 flex w-full flex-col items-center justify-center rounded-xl pb-[30%] lg:pb-0">
          <div className="w-11/12 rounded-xl border-2 border-secondary lg:w-2/3 xl:w-1/3">
            {settings.map((item) => {
              if (item.title == "Contributors") {
                return (
                  <Link
                    href={`/profile/${item.title.toLowerCase()}`}
                    key={item.title}
                    className="flex w-full cursor-pointer justify-between rounded-lg bg-primary p-6 text-xl sm:text-2xl lg:border-0 xl:text-lg"
                  >
                    <div className="flex">
                      <div className="mr-5 flex h-10 w-10 items-center justify-center rounded-3xl bg-secondary text-sm font-medium text-destructive-foreground">
                        {item.icon}
                      </div>
                      <p className="flex items-center font-semibold text-destructive-foreground">
                        {item.title}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <ArrowRight className="ml-3 flex text-secondary-foreground" />
                    </div>
                  </Link>
                );
              }
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
