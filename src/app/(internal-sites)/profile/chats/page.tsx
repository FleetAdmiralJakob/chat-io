import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chats",
  description: "Manage your chat settings and preferences.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Chats",
    description: "Manage your chat settings and preferences.",
  },
};

const ChatsPage = () => {
  return <div className="ml-24">Chats</div>;
};

export default ChatsPage;
