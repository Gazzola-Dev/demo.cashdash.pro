"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { useLayoutData } from "@/hooks/layout.hooks";

function AppShellClient({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData: any;
}) {
  const { data: layoutData } = useLayoutData(initialData);
  return <AppLayout layoutData={layoutData}>{children}</AppLayout>;
}

export default AppShellClient;
