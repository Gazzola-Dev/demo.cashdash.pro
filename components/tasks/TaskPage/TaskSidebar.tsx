// components/tasks/TaskPage/TaskSidebar.tsx
"use client";

import GitBranchCopy from "@/components/tasks/GitBranchCopy";
import {
  AssigneeSelect,
  StatusSelect,
} from "@/components/tasks/TaskSelectComponents";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUpdateTask, useUpdateTasksOrder } from "@/hooks/task.hooks";
import useAppData from "@/hooks/useAppData";
import { Tables } from "@/types/database.types";
import { useEffect, useState } from "react";

type TaskStatus = Tables<"tasks">["status"];

export function TaskSidebar() {
  const { project, task, tasks, setTasks } = useAppData();
  const members = project?.project_members || [];
  const { updateTask, isPending } = useUpdateTask();
  const { updateTasksOrder, isPending: isOrderPending } = useUpdateTasksOrder();

  // Find the highest ordinal_priority number in tasks array
  const highestPriority = tasks.reduce(
    (max, t) => Math.max(max, t.ordinal_priority),
    0,
  );

  // Priority input state
  const [priorityValue, setPriorityValue] = useState<number>(
    task?.ordinal_priority || Math.min(highestPriority + 1, 999),
  );

  // Update priority state when task changes
  useEffect(() => {
    if (task?.ordinal_priority) {
      setPriorityValue(task.ordinal_priority);
    }
  }, [task?.ordinal_priority]);

  const handleStatusChange = (value: TaskStatus) => {
    if (!task) return;
    updateTask(task.id, { status: value });
  };

  const handleAssigneeChange = (value: string | null) => {
    if (!task) return;
    updateTask(task.id, { assignee: value });
  };

  const handlePriorityChange = (value: number) => {
    if (!task) return;

    // Validate bounds
    const validValue = Math.max(1, Math.min(value, tasks.length));
    setPriorityValue(validValue);

    if (task.ordinal_priority === validValue) return; // No change needed

    // Clone and sort the tasks by priority
    const sortedTasks = [...tasks].sort(
      (a, b) => a.ordinal_priority - b.ordinal_priority,
    );

    // Remove the current task that we're changing
    const filteredTasks = sortedTasks.filter(t => t.id !== task.id);

    // Create new array with updated priorities
    const updatedTasks = [];
    let inserted = false;

    // Adjust the validValue to be within the range of available positions
    const safeValue = Math.min(validValue, filteredTasks.length + 1);

    for (let i = 0; i < filteredTasks.length + 1; i++) {
      if (i + 1 === safeValue) {
        // Insert the task at its new position
        updatedTasks.push({
          ...task,
          ordinal_priority: i + 1,
        });
        inserted = true;
      } else if (inserted) {
        // If we've already inserted the task, add the next task from filtered list
        updatedTasks.push({
          ...filteredTasks[i - 1],
          ordinal_priority: i + 1,
        });
      } else {
        // If we haven't inserted yet, add the current task from filtered list
        updatedTasks.push({
          ...filteredTasks[i],
          ordinal_priority: i + 1,
        });
      }
    }

    // Optimistically update the UI
    setTasks(updatedTasks);

    // Update in the database
    updateTasksOrder(updatedTasks);
  };

  const handlePriorityInputBlur = () => {
    handlePriorityChange(priorityValue);
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

          {/* Priority - number input */}
          <div>
            <label className="text-sm font-medium">Priority</label>
            <Input
              type="number"
              min={1}
              max={tasks.length}
              value={priorityValue}
              onChange={e => {
                const newValue = parseInt(e.target.value, 10);
                if (!isNaN(newValue)) {
                  setPriorityValue(newValue);
                }
              }}
              onBlur={handlePriorityInputBlur}
              className="w-32"
              disabled={isPending || isOrderPending}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {isPending || isOrderPending
                ? "Updating..."
                : `${tasks.length} tasks total`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TaskSidebar;
