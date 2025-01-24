import { TaskResult } from "@/types/task.types";

interface TaskHeaderProps {
  task: TaskResult["task"];
}

export function TaskHeader({ task }: TaskHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold">{task.title}</h1>
    </div>
  );
}
