"use server";

import { getLayoutDataAction } from "@/actions/layout.actions";
import AppShellClient from "@/components/layout/AppShellClient";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const { data: initialData } = await getLayoutDataAction();
  return <AppShellClient initialData={initialData}>{children}</AppShellClient>;
}
