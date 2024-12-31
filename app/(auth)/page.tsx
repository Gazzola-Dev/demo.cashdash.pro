import { getLayoutDataAction } from "@/actions/layout.actions";
import AuthLayout from "@/components/layout/AuthLayout";
import configuration from "@/configuration";
import { redirect } from "next/navigation";

export default async function AuthPage() {
  // Check if user is already authenticated
  const { data: layoutData } = await getLayoutDataAction();

  // If authenticated and has projects, redirect to current project
  if (layoutData?.currentProject) {
    redirect(
      configuration.paths.project.overview({
        project_slug: layoutData.currentProject.slug,
      }),
    );
  }
  // If authenticated but no projects, redirect to new project
  if (layoutData?.user) {
    redirect(configuration.paths.project.new);
  }

  return <AuthLayout />;
}
