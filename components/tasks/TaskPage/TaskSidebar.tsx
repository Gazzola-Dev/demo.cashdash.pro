import {
  AssigneeSelect,
  PrioritySelect,
  StatusSelect,
} from "@/components/tasks/TaskSelectComponents";
import { Card, CardContent } from "@/components/ui/card";
import { useGetProject } from "@/hooks/project.hooks";
import { useToastQueue } from "@/hooks/useToastQueue";
import { useIsAdmin } from "@/hooks/user.hooks";
import { Tables } from "@/types/database.types";
import { TaskResult, TaskUpdateWithSubtasks } from "@/types/task.types";
import { format } from "date-fns";
import { useMemo, useState } from "react";

interface TaskSidebarProps {
  task: TaskResult["task"];
  assigneeProfile: TaskResult["assignee_profile"];
  taskSchedule: TaskResult["task_schedule"] | null;
  onUpdateTask: (updates: TaskUpdateWithSubtasks) => void;
}

interface PrevTimes {
  start_date: string | null;
  due_date: string | null;
}

export function TaskSidebar({
  task,
  taskSchedule,
  onUpdateTask,
}: TaskSidebarProps) {
  const { data: projectData } = useGetProject();
  const members = projectData?.project_members || [];
  const { toast } = useToastQueue();
  const [isOpen, setIsOpen] = useState(
    !!taskSchedule?.start_date || !!taskSchedule?.due_date,
  );
  const [prevTimes, setPrevTimes] = useState<PrevTimes>({
    start_date: taskSchedule?.start_date || null,
    due_date: taskSchedule?.due_date || null,
  });
  const isAdmin = useIsAdmin();

  const handleStatusChange = (value: Tables<"tasks">["status"]) => {
    onUpdateTask({ status: value });
  };

  const handlePriorityChange = (value: Tables<"tasks">["priority"]) => {
    onUpdateTask({ priority: value });
  };

  const handleAssigneeChange = (value: string | null) => {
    onUpdateTask({ assignee: value });
  };

  const handleIsOpenChange = (open: boolean) => {
    if (!isAdmin) return;
    if (!open) {
      setPrevTimes({
        start_date: taskSchedule?.start_date || null,
        due_date: taskSchedule?.due_date || null,
      });
      onUpdateTask({
        task_schedule: {
          start_date: null,
          due_date: null,
        },
      });
    } else {
      if (prevTimes.start_date || prevTimes.due_date) {
        onUpdateTask({
          task_schedule: {
            start_date: prevTimes.start_date,
            due_date: prevTimes.due_date,
          },
        });
      }
    }
    setIsOpen(open);
  };

  const handleDateChange = (
    date: Date | undefined,
    type: "start_date" | "due_date",
  ) => {
    if (!date) return;

    const utcDate = new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        12,
        0,
        0,
        0,
      ),
    );

    const scheduleUpdate = {
      task_schedule: {
        start_date:
          type === "start_date"
            ? utcDate.toISOString()
            : taskSchedule?.start_date,
        due_date:
          type === "due_date" ? utcDate.toISOString() : taskSchedule?.due_date,
      },
    };

    const startDate =
      type === "start_date"
        ? utcDate
        : taskSchedule?.start_date
          ? new Date(taskSchedule.start_date)
          : null;
    const dueDate =
      type === "due_date"
        ? utcDate
        : taskSchedule?.due_date
          ? new Date(taskSchedule.due_date)
          : null;

    if (startDate && dueDate && startDate > dueDate) {
      toast({
        title: "Invalid date range",
        description:
          type === "start_date"
            ? "Start date must be before or equal to due date"
            : "Due date must be after or equal to start date",
        variant: "destructive",
      });
      return;
    }

    onUpdateTask(scheduleUpdate);
  };

  const currentStartDate = useMemo(() => {
    if (!taskSchedule?.start_date) return undefined;
    const date = new Date(taskSchedule.start_date);
    return isNaN(date.getTime()) ? undefined : date;
  }, [taskSchedule?.start_date]);

  const currentDueDate = useMemo(() => {
    if (!taskSchedule?.due_date) return undefined;
    const date = new Date(taskSchedule.due_date);
    return isNaN(date.getTime()) ? undefined : date;
  }, [taskSchedule?.due_date]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const disableBefore = today;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Assignee */}
          <div>
            <label className="text-sm font-medium">Assignee</label>
            <AssigneeSelect
              value={task.assignee}
              onValueChange={handleAssigneeChange}
              members={members}
            />
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
