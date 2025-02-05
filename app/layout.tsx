import AppLayout from "@/components/layout/AppLayout";
import Providers from "@/providers/Providers";
import "@/styles/globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cash Dash Pro",
  description: "Upwork and Github AI powered project management",
  icons: {
    icon: [
      {
        url: "/favicon-light.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-dark.svg",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export default async function RootLayout({
  children,
  params: { project_slug },
}: {
  children: React.ReactNode;
  params: {
    project_slug: string;
  };
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <AppLayout projectSlug={project_slug}>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
