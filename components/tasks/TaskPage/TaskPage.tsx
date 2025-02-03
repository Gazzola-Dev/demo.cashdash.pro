"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useGetTask } from "@/hooks/task.hooks";
import { Files, Terminal } from "lucide-react";
import { useParams } from "next/navigation";

export default function TaskPage() {
  const params = useParams();
  const taskSlug = params.task_slug as string;

  const { data: taskData } = useGetTask(taskSlug);

  const handlePublish = () => {
    console.log("PUBLISH");
  };

  if (!taskData) return null;

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <div className="sticky top-0 z-50 mb-4">
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
          <Terminal className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">
            Draft Mode
          </AlertTitle>
          <div className="flex items-center justify-between w-full">
            <AlertDescription className="text-amber-600 dark:text-amber-400">
              This task is currently in draft mode and is only visible to you.
            </AlertDescription>
            <Button
              variant="outline"
              size="sm"
              className="ml-4 border-amber-500 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
              onClick={handlePublish}
            >
              Publish Task
            </Button>
          </div>
        </Alert>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {taskData.task.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {taskData.task.prefix}-{taskData.task.ordinal_id}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Files className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          {taskData.task.description}
        </div>
      </div>
    </div>
  );
}
