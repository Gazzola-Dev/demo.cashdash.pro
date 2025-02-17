"use client";

import useIsMounted from "@/hooks/useIsMounted";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ZIndexProvider } from "@/providers/ZIndexProvider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ReactNode } from "react";

const Providers = ({ children }: { children: ReactNode }) => {
  const isMounted = useIsMounted();
  if (!isMounted) return null;
  return (
    <NuqsAdapter>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ZIndexProvider>{children}</ZIndexProvider>
      </ThemeProvider>
    </NuqsAdapter>
  );
};

export default Providers;
