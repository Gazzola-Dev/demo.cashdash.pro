"use client";

import useIsMounted from "@/hooks/useIsMounted";
import AppProvider from "@/providers/AppProvider";
import QueryProvider from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ZIndexProvider } from "@/providers/ZIndexProvider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ReactNode } from "react";

const Providers = ({ children }: { children: ReactNode }) => {
  const isMounted = useIsMounted();
  if (!isMounted) return null;
  return (
    <QueryProvider>
      <NuqsAdapter>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ZIndexProvider>
            <AppProvider>{children}</AppProvider>
          </ZIndexProvider>
        </ThemeProvider>
      </NuqsAdapter>
    </QueryProvider>
  );
};

export default Providers;
