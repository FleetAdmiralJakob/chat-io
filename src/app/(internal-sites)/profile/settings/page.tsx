import type { Metadata } from "next";
import SettingsContent from "./settings-content";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Manage your account settings, update your profile information, and change your password.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Settings",
    description:
      "Manage your account settings, update your profile information, and change your password.",
  },
};

export default function SettingsPage() {
  return <SettingsContent />;
}
