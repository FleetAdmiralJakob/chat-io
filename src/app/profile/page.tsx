import Navbar from "~/components/navbar";
import { Lock, NotebookText } from "lucide-react";
import { SendHorizontal } from "lucide-react";
import { Bell } from "lucide-react";
import { Settings } from "lucide-react";
import { UsersRound } from "lucide-react";
import { currentUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";

interface Settings {
  title: string;
  icon: JSX.Element;
}

const settings: Settings[] = [
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
      <div className="flex h-full flex-col items-center justify-around lg:pl-24">
        <div>
          <p className="mt-10 text-xl font-bold">Profile</p>
        </div>
        <div className="flex">
          <p className=" text-sm ">
            <Avatar className="h-12 w-12 text-white">
              <AvatarFallback>
                {username ? username.substring(0, 2).toUpperCase() : "Y"}
              </AvatarFallback>
            </Avatar>
          </p>
          <p className="ml-4 mt-3">{user?.username}</p>
        </div>
        <div className="mb-20 w-full">
          {settings.map((item) => {
            return (
              <div
                key={item.title}
                className="flex w-full border-t-2 border-input p-7 text-xl"
              >
                <p className="mr-5 rounded-3xl bg-accent p-3">{item.icon}</p>
                <p className="pt-3">{item.title}</p>
              </div>
            );
          })}
        </div>
      </div>
      <Navbar />
    </div>
  );
}
