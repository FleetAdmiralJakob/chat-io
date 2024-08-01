import PublicHomepage from "~/app/public-homepage";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#191A1D" },
  ],
};

export default async function HomePage() {
  const user = await currentUser();
  if (user) {
    redirect("/chats");
  }

  return <PublicHomepage />;
}
