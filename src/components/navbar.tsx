"use client";

import Link from "next/link";
import { IoChatbubblesSharp } from "react-icons/io5";
import { FaClipboardList } from "react-icons/fa6";
import { CgProfile } from "react-icons/cg";
import { HiUserGroup } from "react-icons/hi2";

const Navbar = () => {
  const IsIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };
  return (
    <div
      className={
        IsIOS()
          ? "fixed bottom-0 flex h-24 w-full items-center justify-around bg-primary pb-3 text-2xl"
          : "fixed bottom-0 flex h-24 w-full items-center justify-around bg-primary text-2xl"
      }
    >
      <Link className={"block"} href={"/"}>
        <IoChatbubblesSharp className={"ml-1.5"} />
        <p className={"mt-0.5 text-sm"}>Chats</p>
      </Link>
      <Link href={"/"}>
        <FaClipboardList className={"ml-1"} />
        <p className={"mt-0.5 text-sm"}>Todo</p>
      </Link>
      <Link href={"/"}>
        <HiUserGroup className={"ml-2"} />
        <p className={"mt-0.5 text-sm"}>Group</p>
      </Link>
      <Link href={"/"}>
        <CgProfile className={"ml-2.5"} />
        <p className={"mt-0.5 text-sm"}>Profile</p>
      </Link>
    </div>
  );
};

export default Navbar;
