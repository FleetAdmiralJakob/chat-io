import Page from "./content";
import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1A1A" },
  ],
};

function ChatPage({ params }: { params: { chatId: string } }) {
  {
    return <Page params={params} />;
  }
}

export default ChatPage;
