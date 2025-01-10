import { getLayoutDataAction } from "@/actions/layout.actions";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  // Check if user is already authenticated
  const { data: layoutData } = await getLayoutDataAction();

  // If authenticated and has projects, redirect to current project
  if (layoutData?.currentProject) {
    redirect(`/project/${layoutData.currentProject.slug}`);
  }

  // If authenticated but no projects, redirect to new project
  if (layoutData?.user) {
    redirect("/projects/new");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight">Cash Dash Pro</h1>
        <p className="text-xl text-muted-foreground">
          AI-powered project management integrated with Upwork and GitHub
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/auth">
            <Button size="lg">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
