import { AddUserDialog } from "~/components/homepage/add-user-dialog";
import Chats from "~/components/homepage/chat-overview";
import { SignOutButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ChatWithSearch from "~/components/chats-with-search";

export default async function ChatOverwiewPage() {
  const user = await currentUser();
  if (!user) redirect("/");
  return <ChatWithSearch user={user} />;
}
