// components/tasks/TaskPage/TaskSidebar.tsx
"use client";

import GitBranchCopy from "@/components/tasks/GitBranchCopy";
import {
  AssigneeSelect,
  PrioritySelect,
  StatusSelect,
} from "@/components/tasks/TaskSelectComponents";
import { Card, CardContent } from "@/components/ui/card";
import { useGetProject } from "@/hooks/query.hooks";
import { useIsAdmin } from "@/hooks/user.hooks";
import { TaskResult, TaskUpdateWithSubtasks } from "@/types/task.types";
import { format } from "date-fns";

interface TaskSidebarProps {
  task: TaskResult["task"];
  assigneeProfile: TaskResult["assignee_profile"];
  taskSchedule: TaskResult["task_schedule"] | null;
  onUpdateTask: (updates: TaskUpdateWithSubtasks) => void;
}

export function TaskSidebar({
  task,
  taskSchedule,
  onUpdateTask,
}: TaskSidebarProps) {
  const { data: projectData } = useGetProject();
  const members = projectData?.project_members || [];
  const isAdmin = useIsAdmin();

  const handleStatusChange = (value: NonNullable<typeof task.status>) => {
    onUpdateTask({ status: value });
  };

  const handlePriorityChange = (value: NonNullable<typeof task.priority>) => {
    onUpdateTask({ priority: value });
  };

  const handleAssigneeChange = (value: string | null) => {
    onUpdateTask({ assignee: value });
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
                  value={task.assignee}
                  onValueChange={handleAssigneeChange}
                  members={members}
                />
                <GitBranchCopy
                  projectPrefix={projectData?.prefix}
                  taskOrdinalId={task.ordinal_id}
                  taskTitle={task.title}
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium">Status</label>
            <StatusSelect
              value={task.status}
              onValueChange={handleStatusChange}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="text-sm font-medium">Priority</label>
            <PrioritySelect
              value={task.priority}
              onValueChange={handlePriorityChange}
            />
          </div>

          {/* Created */}
          <div className="pt-2">
            <div className="text-sm text-muted-foreground">
              Created {format(new Date(task.created_at), "MMM d, yyyy")}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TaskSidebar;
