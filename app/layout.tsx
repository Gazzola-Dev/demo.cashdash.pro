"use client";
import AppLayout from "@/components/layout/AppLayoutComponents";
import { Toaster } from "@/components/ui/toaster";
import Providers from "@/providers/Providers";
import "@/styles/globals.css";

// make server-side for metadata
// export const metadata: Metadata = {
//   title: "Cash Dash Pro",
//   description: "Upwork and Github project management platform",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
