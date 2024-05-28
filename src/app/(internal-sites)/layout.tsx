import Navbar from "~/components/navbar";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/");

  return (
    <div className="min-h-screen">
      {children}
      <Navbar />
    </div>
  );
}
