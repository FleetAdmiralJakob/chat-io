import { currentUser, SignOutButton } from "@clerk/nextjs";
import PublicHomepage from "~/app/public-homepage";
import { AddUserDialog } from "~/components/homepage/add-user-dialog";
import { Chats } from "~/components/homepage/chat-overview";
import Search from "~/components/homepage/search";
import Navbar from "~/components/navbar";

export default async function HomePage() {
  const user = await currentUser();
  if (user) {
    return (
      <>
        <div className="pb-24 lg:ml-24">
          <div className="relative flex h-full w-full justify-center">
            <h1 className="pt-28 text-4xl font-bold">Chats</h1>
            <AddUserDialog classNameDialogTrigger="absolute bg-input right-16 top-16" />
          </div>
          <p className="absolute top-0">
            Current User: {user.username} <br /> <SignOutButton />
          </p>{" "}
          <br />
          <Search />
          <Chats />
        </div>
        <Navbar />
      </>
    );
  }

  return <PublicHomepage />;
}
