import "~/styles/globals.css";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "~/components/theme-provider";
import type { Metadata, Viewport } from "next";
import { cn } from "~/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";

const APP_NAME = "Chat.io";
const APP_DEFAULT_TITLE = "My Awesome PWA App";
const APP_TITLE_TEMPLATE = "%s - PWA App";
const APP_DESCRIPTION = "Best PWA app in the world!";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          GeistSans.className,
          "min-h-screen bg-background font-sans antialiased",
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider>{children}</ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
