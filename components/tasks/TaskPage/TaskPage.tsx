"use client";
import { SubtaskSidebar } from "@/components/tasks/TaskPage/SubtaskSidebar";
import { TaskComments } from "@/components/tasks/TaskPage/TaskComments";
import { TaskDescription } from "@/components/tasks/TaskPage/TaskDescription";
import { TaskHeader } from "@/components/tasks/TaskPage/TaskHeader";
import TaskSidebar from "@/components/tasks/TaskPage/TaskSidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import useDemoData from "@/hooks/useDemoData";
import { TerminalIcon, Trash2 } from "lucide-react";
import { usePathname } from "next/navigation";

export function TaskPage() {
  const { task: taskData } = useDemoData();
  const pathname = usePathname();
  const isDraft = pathname.endsWith("/new");

  const handlePublish = () => {};

  const handleDelete = () => {};

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {isDraft && (
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

      <div className="flex gap-6">
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center">
            <TaskHeader task={taskData?.task} onSave={() => {}} />
            {!isDraft && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task
              </Button>
            )}
          </div>

          <TaskDescription
            description={taskData?.task?.description || ""}
            onSave={() => {}}
          />

          <TaskComments />
        </div>

        <div className="w-80 space-y-6">
          <TaskSidebar />

          <SubtaskSidebar />
        </div>
      </div>
    </div>
  );
}

export default TaskPage;
