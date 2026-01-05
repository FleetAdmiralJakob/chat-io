import type { Metadata } from "next";
import ContributorsContent from "./contributors-content";

export const metadata: Metadata = {
  title: "Contributors",
  description:
    "Meet the team behind Chat.io. Learn about the developers and designers who built this application.",
  openGraph: {
    title: "Contributors",
    description:
      "Meet the team behind Chat.io. Learn about the developers and designers who built this application.",
  },
};

export default function Contributors() {
  return <ContributorsContent />;
}
