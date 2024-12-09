import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import Providers from "@/providers/Providers";
import { poppins } from "@/styles/fonts";

export const metadata: Metadata = {
  title: "My AI, Quest.",
  description:
    "Quest proactively helps you to make the most of AI in your professional and personal life.",
  authors: { name: "Aaron Gazzola" },
  keywords:
    "AI, Chat bot, Quest, My AI, Quest, AI assistant, proactive AI, AI assistant",
  robots: "index, follow",
  openGraph: {
    title: "My AI, Quest.",
    description: "",
    type: "website",
    url: "https://myai.quest",
    siteName: "My AI, Quest.",
    // images: "https://eco3d.shop/images/logo.png",
    locale: "en_US",
  },
};

// TODO: update theme color
export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={
          (cn(poppins.className), "flex flex-col  antialiased min-h-screen")
        }
      >
        <Providers>
          <Header />
          <main className="flex-grow flex flex-col">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
