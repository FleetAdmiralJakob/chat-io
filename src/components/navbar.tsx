"use client";

import { cn } from "~/lib/utils";
import {
  CalendarCheck,
  CircleUser,
  MessagesSquare,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
        "border-secondary bg-primary text-secondary-foreground lg:border-secondary fixed bottom-0 flex h-24 w-full items-center justify-around border-t-2 text-2xl lg:h-full lg:w-24 lg:flex-col lg:justify-start lg:border-t-0 lg:border-r-2",
        { "pb-3": isIOS },
        { "hidden lg:flex": isChatPath },
      )}
    >
      <div className="flex w-full justify-around lg:h-full lg:flex-col">
        <Link
          className="flex flex-col items-center"
          href="/chats"
          aria-label="Go to the chat-overview page"
        >
          <MessagesSquare
            className={cn({
              "text-accent": pathname.includes("/chats"),
            })}
          />
          <p className="mt-0.5 text-sm lg:hidden">Chats</p>
        </Link>
        <Link
          className="flex flex-col items-center"
          href="/todo"
          aria-label="Go to the todo-overview page"
        >
          <CalendarCheck
            className={cn({
              "text-accent": pathname === "/todo",
            })}
          />
          <p className="mt-0.5 text-sm lg:hidden">Todo</p>
        </Link>
        <Link
          className="flex flex-col items-center"
          href="/"
          aria-label="Go to the group page"
        >
          <UsersRound />
          <p className="mt-0.5 text-sm lg:hidden">Group</p>
        </Link>
        <Link
          className="flex flex-col items-center"
          href="/profile"
          aria-label="Go to the profile page, where you can change your personal settings"
        >
          <CircleUser
            className={cn({
              "text-accent": pathname === "/profile",
            })}
          />
          <p className="mt-0.5 text-sm lg:hidden">Profile</p>
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
