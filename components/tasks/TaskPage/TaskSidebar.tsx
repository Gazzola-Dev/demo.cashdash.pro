import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { useToastQueue } from "@/hooks/useToastQueue";
import { cn } from "@/lib/utils";
import { TaskResult } from "@/types/task.types";
import { format } from "date-fns";
import { CalendarIcon, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";

interface TaskSidebarProps {
  task: TaskResult["task"];
  members: any[];
  assigneeProfile: TaskResult["assignee_profile"];
  taskSchedule: TaskResult["task_schedule"] | null;
  onUpdateTask: (updates: any) => void;
}

interface PrevTimes {
  start_date: string | null;
  due_date: string | null;
}

export function TaskSidebar({
  task,
  members,
  assigneeProfile,
  taskSchedule,
  onUpdateTask,
}: TaskSidebarProps) {
  const { toast } = useToastQueue();
  const [isOpen, setIsOpen] = useState(
    !!taskSchedule?.start_date || !!taskSchedule?.due_date,
  );
  const [prevTimes, setPrevTimes] = useState<PrevTimes>({
    start_date: taskSchedule?.start_date || null,
    due_date: taskSchedule?.due_date || null,
  });

  const handleIsOpenChange = (open: boolean) => {
    if (!open) {
      // Store current times before closing
      setPrevTimes({
        start_date: taskSchedule?.start_date || null,
        due_date: taskSchedule?.due_date || null,
      });
      // Clear dates in DB
      onUpdateTask({
        task_schedule: {
          start_date: null,
          due_date: null,
        },
      });
    } else {
      // Restore previous times if they exist
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

    // Set time to noon UTC to avoid timezone issues
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

    // Validate date range
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

  // Disable past dates
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
                <SelectItem value="backlog">Backlog</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
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
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Created */}
          <div className="pt-2">
            <div className="text-sm text-muted-foreground">
              Created {format(new Date(task.created_at), "MMM d, yyyy")}
            </div>
          </div>

          {/* Dates Collapsible */}
          <Collapsible open={isOpen} onOpenChange={handleIsOpenChange}>
            <CollapsibleTrigger className="flex w-full items-center gap-2">
              <ChevronsUpDown className="h-4 w-4" />
              <span className="text-sm font-semibold italic text-gray-700">
                {isOpen ? "Clear start and due date" : "Add start and due date"}
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Start Date */}
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !currentStartDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentStartDate ? (
                        format(currentStartDate, "PPP")
                      ) : (
                        <span>Set start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={currentStartDate}
                      onSelect={date => handleDateChange(date, "start_date")}
                      disabled={date => date < disableBefore}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                        !currentDueDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentDueDate ? (
                        format(currentDueDate, "PPP")
                      ) : (
                        <span>Set due date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={currentDueDate}
                      onSelect={date => handleDateChange(date, "due_date")}
                      disabled={date => date < disableBefore}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}

export default TaskSidebar;
