import AuthProvider from "@/providers/AuthProvider";
import ProgressProvider from "@/providers/ProgressProvider";
import QueryProvider from "@/providers/QueryProvider";
import SuspendedSearchParamsProvider from "@/providers/SearchParamsProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ZIndexProvider } from "@/providers/ZIndexProvider";
import { ReactNode } from "react";

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <QueryProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ZIndexProvider>
          <ProgressProvider>
            <SuspendedSearchParamsProvider>
              <AuthProvider>{children}</AuthProvider>
            </SuspendedSearchParamsProvider>
          </ProgressProvider>
        </ZIndexProvider>
      </ThemeProvider>
    </QueryProvider>
  );
};

export default Providers;
