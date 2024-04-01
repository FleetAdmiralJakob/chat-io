import { currentUser } from "@clerk/nextjs";
import PublicHomepage from "~/app/public-homepage";
import { AddUserDialog } from "~/components/add-user-dialog";

export default async function HomePage() {
  const user = await currentUser();
  if (user) {
    return (
      <div className="relative flex h-full w-full justify-center">
        <h1 className="pt-28 text-4xl font-bold">Chats</h1>
        <AddUserDialog classNameDialogTrigger="absolute right-16 top-16" />
      </div>
    );
  }

  return <PublicHomepage />;
}
