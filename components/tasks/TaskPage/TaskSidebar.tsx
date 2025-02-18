// components/tasks/TaskPage/TaskSidebar.tsx
"use client";

import GitBranchCopy from "@/components/tasks/GitBranchCopy";
import {
  AssigneeSelect,
  PrioritySelect,
  StatusSelect,
} from "@/components/tasks/TaskSelectComponents";
import { Card, CardContent } from "@/components/ui/card";
import useDemoData from "@/hooks/useDemoData";

export function TaskSidebar() {
  const { project: projectData, task: taskData } = useDemoData();
  const members = projectData?.project_members || [];

  const task = taskData?.task;
  const handleStatusChange = () => {};

  const handlePriorityChange = () => {};

  const handleAssigneeChange = (value: string | null) => {};

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
                  projectPrefix={projectData?.prefix}
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

          {/* Priority */}
          <div>
            <label className="text-sm font-medium">Priority</label>
            <PrioritySelect
              value={task?.priority || "medium"}
              onValueChange={handlePriorityChange}
            />
          </div>

          {/* Created */}
          {/* <div className="pt-2">
            <div className="text-sm text-muted-foreground">
              Created {format(new Date(task?.created_at || ""), "MMM d, yyyy")}
            </div>
          </div> */}
        </div>
      </CardContent>
    </Card>
  );
}

export default TaskSidebar;
