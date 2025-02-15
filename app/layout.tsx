import { getProfileAction } from "@/actions/profile.actions";
import { createServerSupabaseClient } from "@/clients/action-client";
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
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await getProfileAction();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <AppLayout profile={profile} user={user}>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
