import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TaskResult } from "@/types/task.types";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface TaskSidebarProps {
  task: TaskResult["task"];
  members: any[];
  assigneeProfile: TaskResult["assignee_profile"];
  taskSchedule: TaskResult["task_schedule"];
  onUpdateTask: (updates: any) => void;
}

export function TaskSidebar({
  task,
  members,
  assigneeProfile,
  taskSchedule,
  onUpdateTask,
}: TaskSidebarProps) {
  const handleDueDateChange = (date: Date | undefined) => {
    if (!date) return;

    const schedule = taskSchedule?.[0] || {};
    onUpdateTask({
      task_schedule: [
        {
          ...schedule,
          due_date: date.toISOString(),
        },
      ],
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Assignee */}
          <div>
            <label className="text-sm font-medium">Assignee</label>
            <Select
              value={task.assignee || "unassigned"}
              onValueChange={value =>
                onUpdateTask({
                  assignee: value === "unassigned" ? null : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue>
                  {assigneeProfile ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={assigneeProfile.avatar_url || undefined}
                        />
                        <AvatarFallback>
                          {assigneeProfile.display_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {assigneeProfile.display_name || "Unnamed User"}
                      </span>
                    </div>
                  ) : (
                    "Unassigned"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="unassigned" value="unassigned">
                  Unassigned
                </SelectItem>
                {members.map((member, index) => (
                  <SelectItem
                    key={`${member.user_id}-${index}`}
                    value={member.user_id}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={member.profile?.avatar_url || undefined}
                        />
                        <AvatarFallback>
                          {member.profile?.display_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {member.profile?.display_name || "Unnamed User"}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select
              value={task.status}
              onValueChange={value => onUpdateTask({ status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="backlog" value="backlog">
                  Backlog
                </SelectItem>
                <SelectItem key="todo" value="todo">
                  To Do
                </SelectItem>
                <SelectItem key="in_progress" value="in_progress">
                  In Progress
                </SelectItem>
                <SelectItem key="in_review" value="in_review">
                  In Review
                </SelectItem>
                <SelectItem key="completed" value="completed">
                  Completed
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div>
            <label className="text-sm font-medium">Priority</label>
            <Select
              value={task.priority}
              onValueChange={value => onUpdateTask({ priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="low" value="low">
                  Low
                </SelectItem>
                <SelectItem key="medium" value="medium">
                  Medium
                </SelectItem>
                <SelectItem key="high" value="high">
                  High
                </SelectItem>
                <SelectItem key="urgent" value="urgent">
                  Urgent
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-sm font-medium">Due Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !taskSchedule?.[0]?.due_date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {taskSchedule?.[0]?.due_date ? (
                    format(new Date(taskSchedule[0].due_date), "PPP")
                  ) : (
                    <span>Set due date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    taskSchedule?.[0]?.due_date
                      ? new Date(taskSchedule[0].due_date)
                      : undefined
                  }
                  onSelect={handleDueDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
