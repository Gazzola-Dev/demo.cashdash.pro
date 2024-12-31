import { getLayoutDataAction } from "@/actions/layout.actions";
import { AppLayout } from "@/components/layout/AppLayout";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import configuration from "@/configuration";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: layoutData, error } = await getLayoutDataAction();

  if (!layoutData || error) {
    redirect("/auth");
  }

  if (!layoutData.projects || layoutData.projects.length === 0) {
    redirect(configuration.paths.project.new);
  }

  return (
    <LayoutWrapper initialData={layoutData}>
      <AppLayout layoutData={layoutData}>{children}</AppLayout>
    </LayoutWrapper>
  );
}
