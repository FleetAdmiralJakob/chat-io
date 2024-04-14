"use client";

import Link from "next/link";
import { IoChatbubblesSharp } from "react-icons/io5";
import { FaClipboardList } from "react-icons/fa6";
import { CgProfile } from "react-icons/cg";
import { HiUserGroup } from "react-icons/hi2";
import { cn } from "~/lib/utils";

const Navbar = () => {
  const IsIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };
  return (
    <div
      className={cn(
        "fixed bottom-0 flex h-24 w-full items-center justify-around bg-primary text-2xl",
        { "pb-3": IsIOS() },
      )}
    >
      <Link className={"flex flex-col items-center"} href={"/"}>
        <IoChatbubblesSharp />
        <p className={"mt-0.5 text-sm"}>Chats</p>
      </Link>
      <Link className={"flex flex-col items-center"} href={"/"}>
        <FaClipboardList />
        <p className={"mt-0.5 text-sm"}>Todo</p>
      </Link>
      <Link className={"flex flex-col items-center"} href={"/"}>
        <HiUserGroup />
        <p className={"mt-0.5 text-sm"}>Group</p>
      </Link>
      <Link className={"flex flex-col items-center"} href={"/"}>
        <CgProfile />
        <p className={"mt-0.5 text-sm"}>Profile</p>
      </Link>
    </div>
  );
};

export default Navbar;