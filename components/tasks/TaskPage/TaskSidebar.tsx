// components/tasks/TaskPage/TaskSidebar.tsx
"use client";

import GitBranchCopy from "@/components/tasks/GitBranchCopy";
import {
  AssigneeSelect,
  StatusSelect,
} from "@/components/tasks/TaskSelectComponents";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUpdateTask } from "@/hooks/task.hooks";
import useAppData from "@/hooks/useAppData";
import { Tables } from "@/types/database.types";

type TaskStatus = Tables<"tasks">["status"];

export function TaskSidebar() {
  const { project, task, tasks } = useAppData();
  const members = project?.project_members || [];
  const { updateTask } = useUpdateTask();

  // Find the highest ordinal_priority number in tasks array
  const highestPriority = tasks.reduce(
    (max, t) => Math.max(max, t.ordinal_priority),
    0,
  );

  const handleStatusChange = (value: TaskStatus) => {
    if (task) {
      updateTask(task.id, { status: value });
    }
  };

  const handleAssigneeChange = (value: string | null) => {
    if (task) {
      updateTask(task.id, { assignee: value });
    }
  };

  const handlePriorityChange = (value: number) => {
    if (task) {
      updateTask(task.id, { ordinal_priority: value });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-full">
              <label className="text-sm font-medium">Assignee</label>
              <div className="flex items-center justify-between flex-grow">
                <AssigneeSelect
                  value={task?.assignee || null}
                  onValueChange={handleAssigneeChange}
                  members={members}
                />
                <GitBranchCopy
                  projectPrefix={project?.prefix}
                  taskOrdinalId={task?.ordinal_id || 0}
                  taskTitle={task?.title || ""}
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium">Status</label>
            <StatusSelect
              value={task?.status || "backlog"}
              onValueChange={handleStatusChange}
            />
          </div>

          {/* Priority - replaced select with number input */}
          <div>
            <label className="text-sm font-medium">Priority</label>
            <Input
              type="number"
              min={1}
              max={highestPriority || 999}
              value={task?.ordinal_priority || 1}
              onChange={e => handlePriorityChange(parseInt(e.target.value, 10))}
              className="w-32"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TaskSidebar;
