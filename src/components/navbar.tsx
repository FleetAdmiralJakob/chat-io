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

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-0 flex h-24 w-full items-center justify-around bg-primary text-2xl text-secondary-foreground lg:h-full lg:w-24 lg:flex-col lg:border-r-2 lg:border-gray-950",
        { "pb-3": isIOS },
      )}
    >
      <Link className={"flex flex-col items-center"} href={"/"}>
        <MessagesSquare
          className={cn({
            "text-accent": pathname.includes("/chats"),
          })}
        />
        <p className={"mt-0.5 text-sm"}>Chats</p>
      </Link>
      <Link className={"flex flex-col items-center"} href={"/todo"}>
        <CalendarCheck
          className={cn({
            "text-accent": pathname === "/todo",
          })}
        />
        <p className={"mt-0.5 text-sm"}>Todo</p>
      </Link>
      <Link className={"flex flex-col items-center"} href={"/"}>
        <UsersRound />
        <p className={"mt-0.5 text-sm"}>Group</p>
      </Link>
      <Link className={"flex flex-col items-center"} href={"/profile"}>
        <CircleUser
          className={cn({
            "text-accent": pathname === "/profile",
          })}
        />
        <p className={"mt-0.5 text-sm"}>Profile</p>
      </Link>
    </div>
  );
};

export default Navbar;
