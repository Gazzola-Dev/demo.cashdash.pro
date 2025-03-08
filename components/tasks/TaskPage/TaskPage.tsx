// components/tasks/TaskPage/TaskPage.tsx
"use client";
import { TaskDescription } from "@/components/tasks/TaskPage/TaskDescription";
import { TaskHeader } from "@/components/tasks/TaskPage/TaskHeader";
import TaskSidebar from "@/components/tasks/TaskPage/TaskSidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import useAppData from "@/hooks/useAppData";
import { AlertTriangle, TerminalIcon, Trash2 } from "lucide-react";
import { usePathname } from "next/navigation";

export function TaskPage() {
  const pathname = usePathname();
  const { project, currentMilestone } = useAppData();

  // Check if we're on the new task route
  const isNewTask = pathname.endsWith("/new");

  // Check if there's a draft milestone
  const hasDraftMilestone = currentMilestone?.status === "draft";

  // Show warning if it's a new task and there's no draft milestone
  const showMilestoneWarning = isNewTask && !hasDraftMilestone;

  const handlePublish = () => {};

  const handleDelete = () => {};

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {isNewTask && (
        <div className="sticky top-0 z-50 mb-4">
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
            <TerminalIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">
              Draft Mode
            </AlertTitle>
            <div className="flex items-center justify-between w-full">
              <AlertDescription className="text-amber-600 dark:text-amber-400">
                This task is currently in draft mode and is only visible to you.
              </AlertDescription>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-500 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {"Delete"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-500 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                  onClick={handlePublish}
                >
                  Publish Task
                </Button>
              </div>
            </div>
          </Alert>
        </div>
      )}

      {showMilestoneWarning && (
        <div className="mb-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Milestone Required</AlertTitle>
            <AlertDescription>
              New tasks can&apos;t be added to active Milestones. Please
              consider adding or editing a sub-task, or requesting a draft
              milestone.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex gap-6">
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center">
            <TaskHeader />
          </div>

          <TaskDescription />

          {/* <TaskComments /> */}
        </div>

        <div className="w-80 space-y-6">
          <TaskSidebar />

          {/* <SubtaskSidebar /> */}
        </div>
      </div>
    </div>
  );
}

export default TaskPage;
