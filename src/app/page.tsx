import { AddUserDialog } from "~/components/homepage/add-user-dialog";
import Chats from "~/components/homepage/chat-overview";
import Navbar from "~/components/navbar";
import PublicHomepage from "~/app/public-homepage";
import { SignOutButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await currentUser();
  if (user) {
      redirect("/chats");
  }

  return <PublicHomepage />;
}
