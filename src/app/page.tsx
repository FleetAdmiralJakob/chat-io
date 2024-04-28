import PublicHomepage from "~/app/public-homepage";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await currentUser();
  if (user) {
    redirect("/chats");
  }

  return <PublicHomepage />;
}
