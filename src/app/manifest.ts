import { type MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chat.io",
    short_name: "Chat.io",
    icons: [
      {
        src: "/icons/chatio.png",
        sizes: "193x193",
        type: "image/png",
        purpose: "any",
      },
    ],
    theme_color: "#FFFFFF",
    background_color: "#FFFFFF",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
  };
}
