import type { Metadata } from "next";
import ProfileContent from "./profile-content";

export const metadata: Metadata = {
  title: "Profile",
  description: "View and manage your Chat.io profile and account settings.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Profile",
    description: "View and manage your Chat.io profile and account settings.",
  },
};

export default function Profile() {
  return <ProfileContent />;
}
