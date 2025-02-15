"use client";

import useIsMounted from "@/hooks/useIsMounted";
import AuthProvider from "@/providers/AuthProvider";
import ProjectProvider from "@/providers/ProjectProvider";
import QueryProvider from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ZIndexProvider } from "@/providers/ZIndexProvider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ReactNode } from "react";

const Providers = ({ children }: { children: ReactNode }) => {
  const isMounted = useIsMounted();
  if (!isMounted) return null;
  return (
    <NuqsAdapter>
      <QueryProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ZIndexProvider>
            <AuthProvider>
              <ProjectProvider>{children}</ProjectProvider>
            </AuthProvider>
          </ZIndexProvider>
        </ThemeProvider>
      </QueryProvider>
    </NuqsAdapter>
  );
};

export default Providers;
