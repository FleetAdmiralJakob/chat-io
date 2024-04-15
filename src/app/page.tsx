import { currentUser, SignOutButton } from "@clerk/nextjs";
import PublicHomepage from "~/app/public-homepage";
import { AddUserDialog } from "~/components/homepage/add-user-dialog";
import Navbar from "~/components/navbar";
import { Chats } from "~/components/homepage/chat-overview";

export default async function HomePage() {
  const user = await currentUser();
  if (user) {
    return (
      <>
        <div className="relative flex h-full w-full justify-center">
          <h1 className="pt-28 text-4xl font-bold">Chats</h1>
          <AddUserDialog classNameDialogTrigger="absolute right-16 top-16" />
        </div>
        Current User: {user.username} <br />
        <SignOutButton />
        <Chats />
        <Navbar />
      </>
    );
  }

  return <PublicHomepage />;
}
