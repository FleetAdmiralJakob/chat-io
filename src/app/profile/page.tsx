import Navbar from "~/components/navbar";
import { Lock, NotebookText } from "lucide-react";
import { SendHorizontal } from "lucide-react";
import { Bell } from "lucide-react";
import { Settings } from "lucide-react";
import { UsersRound } from "lucide-react";
import { currentUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import Link from "next/link";

interface settingsCard {
  title: string;
  icon: JSX.Element;
}

const settings: settingsCard[] = [
  { title: "Account", icon: <Lock /> },
  { title: "Chats", icon: <SendHorizontal /> },
  { title: "Notification", icon: <Bell /> },
  { title: "Settings", icon: <Settings /> },
  { title: "Contributors", icon: <UsersRound /> },
];

export default async function Profile() {
  const user = await currentUser();
  const username = user?.username;

  return (
    <div className="h-screen">
      <div className=" flex h-full flex-col items-center justify-around lg:pl-24">
        <div className="flex flex-col items-center">
          <p className=" my-10 mt-16 text-xl font-bold sm:text-2xl xl:hidden">
            Profile
          </p>

          <div className="flex xl:mt-14">
            <p className=" text-sm">
              <Avatar className="h-12 w-12 text-white ">
                <AvatarFallback>
                  {username ? username.substring(0, 2).toUpperCase() : "Y"}
                </AvatarFallback>
              </Avatar>
            </p>
            <p
              className="ml-4 text-sm
            xl:mt-2 xl:text-lg"
            >
              {user?.lastName && user.firstName ? (
                <div>
                  {user.firstName} {user?.lastName} /{" "}
                  <br className="xl:hidden" /> {user.username}
                </div>
              ) : (
                <div className="xl:mt-4">{user?.username}</div>
              )}
            </p>
          </div>
        </div>
        <div className="mb-20 mt-10 w-full pb-24 sm:mb-32 lg:w-2/3 xl:w-1/3">
          {settings.map((item) => {
            return (
              <Link
                key={item.title}
                href={`/profile/${item.title.toLowerCase()}`}
                className="flex w-full cursor-pointer border-t-2 border-input p-7 text-xl sm:text-2xl lg:mt-6 lg:rounded-xl lg:border-0 lg:bg-input xl:text-xl"
              >
                <p className="mr-5 rounded-3xl bg-accent p-3 text-white">
                  {item.icon}
                </p>
                <p className="pt-3">{item.title}</p>
              </Link>
            );
          })}
        </div>
      </div>
      <Navbar />
    </div>
  );
}
