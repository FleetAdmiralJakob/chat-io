import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resize";
import ChatsWithSearch from "~/components/chats-with-search";
import { currentUser } from "@clerk/nextjs/server";
import { IoMdVideocam } from "react-icons/io";
import { redirect } from "next/navigation";
import { TiMicrophone } from "react-icons/ti";
import { Input } from "~/components/ui/input";
import { BiSolidPhoneCall } from "react-icons/bi";
import Badge from "~/components/ui/badge";

export default async function Page({ params }: { params: { chatId: string } }) {
  const user = await currentUser();
  if (!user) redirect("/");

  const otherUser = "Chat.io";

  return (
    <>
      <div className="flex h-screen flex-col">
        <ResizablePanelGroup
          className="w-full flex-grow"
          direction="horizontal"
        >
          <ResizablePanel className="w-full">
            <ChatsWithSearch classNameChat="justify-center" user={user} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel
            defaultSize={70}
            minSize={40}
            maxSize={73}
            className="flex flex-col"
          >
            <p className="absolute bottom-20">ChatID: {params.chatId}</p>
            <div className="flex h-20 w-full items-center justify-between bg-primary">
              <div className="ml-16 flex w-3/12 items-center justify-around">
                <div className="mr-2.5 rounded-full bg-black p-4 px-6 pt-4 text-2xl">
                  {otherUser.charAt(0).toUpperCase()}
                </div>
                <div className="flex">
                  <p className="mx-2.5 text-2xl font-bold">{otherUser}</p>
                  <div className="mt-0.5">
                    <Badge>Support</Badge>
                  </div>
                </div>
              </div>
              <div className="mr-16 flex text-xl">
                <BiSolidPhoneCall className="mr-14 h-12 w-12 cursor-pointer rounded-full bg-secondary p-2.5" />
                <IoMdVideocam className="h-12 w-12 cursor-pointer rounded-full bg-secondary p-2.5" />
              </div>
            </div>
            <div className="flex-grow"></div>
            <div className="flex h-20 w-full items-center justify-start bg-primary p-4">
              <div className="flex w-full justify-between">
                <Input
                  className="ml-4 w-10/12 bg-secondary p-2"
                  placeholder="Message ..."
                />
                <div>
                  <TiMicrophone className="mx-4 h-14 w-14 cursor-pointer rounded-full bg-accent p-3" />
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}
