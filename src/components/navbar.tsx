"use client";

import { useEffect, useState } from "react";

import { CalendarCheck } from "lucide-react";
import { CircleUser } from "lucide-react";
import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { UsersRound } from "lucide-react";
import { cn } from "~/lib/utils";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const [isIOS, setIsIOS] = useState(false);
  const pathname = usePathname();
  const isChatPath = pathname.startsWith("/chats/");

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-0 flex h-24 w-full items-center justify-around bg-primary text-2xl text-secondary-foreground lg:h-full lg:w-24 lg:flex-col lg:justify-start lg:border-r-2 lg:border-secondary-foreground",
        { "pb-3": isIOS },
        { "hidden lg:flex": isChatPath },
      )}
    >
      <div className="flex w-full justify-around lg:h-full lg:flex-col">
        <Link className={"flex flex-col items-center"} href={"/"}>
          <MessagesSquare
            className={cn({
              "text-accent": pathname.includes("/chats"),
            })}
          />
          <p className={"mt-0.5 text-sm lg:hidden"}>Chats</p>
        </Link>
        <Link className={"flex flex-col items-center"} href={"/todo"}>
          <CalendarCheck
            className={cn({
              "text-accent": pathname === "/todo",
            })}
          />
          <p className={"mt-0.5 text-sm lg:hidden"}>Todo</p>
        </Link>
        <Link className={"flex flex-col items-center"} href={"/"}>
          <UsersRound />
          <p className={"mt-0.5 text-sm lg:hidden"}>Group</p>
        </Link>
        <Link className={"flex flex-col items-center"} href={"/profile"}>
          <CircleUser
            className={cn({
              "text-accent": pathname === "/profile",
            })}
          />
          <p className={"mt-0.5 text-sm lg:hidden"}>Profile</p>
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
