import type { Metadata } from "next";
import ChatWithSearch from "~/components/chats-with-search";

export const metadata: Metadata = {
  title: "Chats",
  description: "View and manage all your conversations in one place.",
  openGraph: {
    title: "Chats",
    description: "View and manage all your conversations in one place.",
  },
};

export default function ChatOverwiewPage() {
  return (
    <main>
      <ChatWithSearch />
    </main>
  );
}
