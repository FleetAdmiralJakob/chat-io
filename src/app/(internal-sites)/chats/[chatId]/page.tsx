import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resize";
import ChatsWithSearch from "~/components/chats-with-search";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Page({ params }: { params: { chatId: string } }) {
  const user = await currentUser();
  if (!user) redirect("/");

  return (
    <>
      <div className=" h-screen">
        <ResizablePanelGroup className={"w-screen"} direction="horizontal">
          <ResizablePanel className={"w-full"}>
            <ChatsWithSearch classNameChat={"justify-center"} user={user} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>ChatID: {params.chatId}</ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}
