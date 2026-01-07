"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import {
  ArrowRight,
  Bell,
  Lock,
  SendHorizontal,
  Settings,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";

interface settingsCard {
  title: string;
  icon?: JSX.Element;
}

export default function ProfileContent() {
  const clerkUser = useUser();
  const username = clerkUser.user ? (clerkUser.user.username ?? "") : "";
  const { signOut } = useAuth();

  const settings: settingsCard[] = [
    { title: username },
    { title: "Settings", icon: <Settings /> },
    { title: "Notification", icon: <Bell /> },
    { title: "Privacy", icon: <Lock /> },
    { title: "Chats", icon: <SendHorizontal /> },
  ];

  return (
    <main className="mt-7 flex h-screen flex-col items-center lg:mt-0 lg:justify-around lg:pl-24">
      <div className="flex flex-col items-center">
        <p className="my-10 text-xl font-bold sm:text-2xl">Profile</p>
      </div>
      <div className="flex w-full flex-col items-center justify-center gap-8 pb-[30%] lg:pb-0">
        <div className="border-secondary flex w-11/12 flex-col items-center justify-center rounded-xl border-2 lg:w-2/3 xl:w-1/3">
          {settings.map((item, index) => {
            if (item.title == username) {
              return (
                <div
                  key={index}
                  className="bg-primary flex w-full cursor-pointer rounded-lg p-6 text-xl sm:text-2xl xl:text-lg"
                >
                  <div className="bg-background text-destructive-foreground mr-5 flex h-10 w-10 items-center justify-center rounded-3xl text-sm font-medium">
                    {item.title.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-destructive-foreground pt-2 font-semibold">
                    {item.title}
                  </p>
                </div>
              );
            }
          })}
        </div>
        <div className="border-secondary flex w-11/12 flex-col items-center justify-center rounded-xl border-2 lg:w-2/3 xl:w-1/3">
          {settings.map((item) => {
            if (item.title == username) {
              return;
            }
            return (
              <Link
                key={item.title}
                href={`/profile/${item.title.toLowerCase()}`}
                className={cn(
                  "border-secondary bg-primary flex w-full cursor-pointer justify-between border-t-2 p-6 text-xl sm:text-2xl xl:text-lg",
                  {
                    "rounded-t-lg border-t-0": item.title == "Settings",
                    "rounded-b-lg": item.title == "Chats",
                  },
                )}
              >
                <div className="flex">
                  <div className="bg-secondary text-destructive-foreground mr-5 flex h-10 w-10 items-center justify-center rounded-3xl text-sm font-medium">
                    {item.icon}
                  </div>
                  <p className="text-destructive-foreground flex items-center font-semibold">
                    {item.title}
                  </p>
                </div>
                <div className="flex items-center">
                  <ArrowRight className="text-secondary-foreground ml-3 flex" />
                </div>
              </Link>
            );
          })}
        </div>
        <div className="flex w-full flex-col items-center justify-center rounded-xl">
          <div className="border-secondary w-11/12 rounded-xl border-2 lg:w-2/3 xl:w-1/3">
            <Link
              href="/contributors"
              className="bg-primary flex w-full cursor-pointer justify-between rounded-lg p-6 text-xl sm:text-2xl lg:border-0 xl:text-lg"
            >
              <div className="flex">
                <div className="bg-secondary text-destructive-foreground mr-5 flex h-10 w-10 items-center justify-center rounded-3xl text-sm font-medium">
                  <UsersRound />
                </div>
                <p className="text-destructive-foreground flex items-center font-semibold">
                  Contributors
                </p>
              </div>
              <div className="flex items-center">
                <ArrowRight className="text-secondary-foreground ml-3 flex" />
              </div>
            </Link>
          </div>
        </div>
        <Button variant="destructive" onMouseDown={() => signOut()}>
          Sign Out
        </Button>
      </div>
    </main>
  );
}
