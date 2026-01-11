import type { Metadata } from "next";
import NotificationContent from "./notification-content";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Manage your notification preferences for Chat.io.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Notifications",
    description: "Manage your notification preferences for Chat.io.",
  },
};

const NotificationPage = () => {
  return <NotificationContent />;
};

export default NotificationPage;
