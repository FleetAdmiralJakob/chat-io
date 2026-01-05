import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Manage your privacy settings and control your data on Chat.io.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Privacy",
    description:
      "Manage your privacy settings and control your data on Chat.io.",
  },
};

const PrivacyPage = () => {
  return <div className="ml-24">Privacy</div>;
};

export default PrivacyPage;
