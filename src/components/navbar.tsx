"use client";

import Link from "next/link";
import { IoChatbubblesSharp } from "react-icons/io5";
import { FaClipboardList } from "react-icons/fa6";
import { CgProfile } from "react-icons/cg";
import { HiUserGroup } from "react-icons/hi2";
import { cn } from "~/lib/utils";
import { useEffect, useState } from "react";

const Navbar = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [pathname, setPathname] = useState("/");

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setPathname(window.location.pathname);
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-0 flex h-24 w-full items-center justify-around bg-primary text-2xl text-secondary-foreground lg:h-full lg:w-24 lg:flex-col lg:border-r-2 lg:border-gray-950",
        { "pb-3": isIOS },
      )}
    >
      <Link className={"flex flex-col items-center"} href={"/"}>
        <IoChatbubblesSharp
          className={cn({
            "text-accent": pathname === "/",
          })}
        />
        <p className={"mt-0.5 text-sm"}>Chats</p>
      </Link>
      <Link className={"flex flex-col items-center"} href={"/todo"}>
        <FaClipboardList
          className={cn({
            "text-accent": pathname === "/todo",
          })}
        />
        <p className={"mt-0.5 text-sm"}>Todo</p>
      </Link>
      <Link className={"flex flex-col items-center"} href={"/"}>
        <HiUserGroup />
        <p className={"mt-0.5 text-sm"}>Group</p>
      </Link>
      <Link className={"flex flex-col items-center"} href={"/profile"}>
        <CgProfile
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
