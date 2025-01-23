import { TaskResult } from "@/types/task.types";
import { format } from "date-fns";

interface TaskHeaderProps {
  task: TaskResult["task"];
}

export function TaskHeader({ task }: TaskHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold mb-2">{task.title}</h1>
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Created {format(new Date(task.created_at), "MMM d, yyyy")}
        </div>
      </div>
    </div>
  );
}
