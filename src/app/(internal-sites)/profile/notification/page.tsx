import type { Metadata } from "next";

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
  return <div className="ml-24">Notification</div>;
};

export default NotificationPage;
