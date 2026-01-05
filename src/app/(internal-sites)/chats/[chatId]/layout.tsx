import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat",
  description: "Chat with your friends in real-time.",
  openGraph: {
    title: "Chat",
    description: "Chat with your friends in real-time.",
  },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
