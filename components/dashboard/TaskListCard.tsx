import { StatusIconSimple } from "@/components/tasks/SimpleTaskSelectComponents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import configuration from "@/configuration";
import { useUpdateTask, useUpdateTasksOrder } from "@/hooks/task.hooks";
import { useIsMobile } from "@/hooks/use-mobile";
import useAppData from "@/hooks/useAppData";
import { capitalizeFirstLetter } from "@/lib/string.util";
import { cn } from "@/lib/utils";
import { Database } from "@/types/database.types";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  Check,
  ChevronDown,
  ExternalLink,
  Menu,
  Plus,
  Search,
  ShieldEllipsis,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const TaskSkeleton = ({ open }: { open: boolean }) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 py-1.5 select-none text-sm bg-white dark:bg-gray-900 animate-pulse",
        open ? "pl-4 pr-3 rounded-l-lg rounded-r-full" : "rounded-br-lg",
      )}
    >
      {/* Priority number */}
      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>

      {open && (
        <>
          {/* Status icon */}
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>

          {/* Task ID */}
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>

          {/* Task title */}
          <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>

          {/* Avatar */}
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </>
      )}
    </div>
  );
};

type TaskStatus = Database["public"]["Enums"]["task_status"];

const TaskListCard = () => {
  const { project, tasks, isAdmin } = useAppData();
  const isMobile = useIsMobile();
  const { updateTask } = useUpdateTask();
  const { updateTasksOrder } = useUpdateTasksOrder();

  const [searchQuery, setSearchQuery] = useState("");
  const [ordinalSearch, setOrdinalSearch] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [isAssigneePopoverOpen, setIsAssigneePopoverOpen] = useState(false);

  const members = project?.project_members || [];

  // Filter tasks based on search queries and selected assignees
  const filteredTasks = tasks.filter(task => {
    const titleMatch = task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const ordinalMatch = ordinalSearch
      ? task.ordinal_id.toString().includes(ordinalSearch)
      : true;
    const assigneeMatch =
      selectedAssignees.length === 0
        ? true
        : selectedAssignees.includes(task.assignee || "");
    return titleMatch && ordinalMatch && assigneeMatch;
  });

  // Sort tasks by ordinal priority
  const sortedTasks = [...filteredTasks].sort(
    (a, b) => a.ordinal_priority - b.ordinal_priority,
  );

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update ordinal priorities based on new positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      ordinal_priority: index + 1,
    }));

    // Call the hook to update the task order
    updateTasksOrder(updatedItems);
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    // Use the updateTask hook to update the task status
    updateTask(taskId, { status: newStatus as TaskStatus });
  };

  const handleAssigneeChange = (
    taskId: string,
    newAssigneeId: string | null,
  ) => {
    // Use the updateTask hook to update the task assignee
    updateTask(taskId, { assignee: newAssigneeId });
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId],
    );
  };

  const getSelectedAssigneesDisplayText = () => {
    if (selectedAssignees.length === 0) return "Assignee";
    if (selectedAssignees.length === 1) {
      const member = members.find(m => m.user_id === selectedAssignees[0]);
      return member?.profile?.display_name || "Unknown";
    }
    return `${selectedAssignees.length} assignees`;
  };

  const createNewTask = () => {
    // In a real implementation, this would navigate to task creation page
    if (project) {
      window.location.href = configuration.paths.tasks.new({
        project_slug: project.slug,
      });
    }
  };

  return (
    <div className="relative h-full flex-shrink-0">
      {!isAdmin && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Card className="w-56 bg-white/70 dark:bg-black/70">
            <CardHeader className="flex items-center justify-between text-gray-700 dark:text-gray-300 gap-2 pb-5">
              <CardTitle className="text-lg">Admin Required</CardTitle>
              <ShieldEllipsis className="size-8" />
            </CardHeader>
            <CardContent className="flex justify-center ">
              <Link
                rel="noopener noreferrer"
                target="_blank"
                href="https://demo.cashdash.pro"
              >
                <Button variant="outline">
                  View demo
                  <ExternalLink className="size-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
      <Card
        className={cn(
          !isAdmin && "blur",
          "flex flex-col",
          "h-full max-h-[calc(100vh-100px)] md:max-h-[40rem]",
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex flex-row items-center justify-between">
            <CardTitle>Tasks ({sortedTasks.length})</CardTitle>
            <Button size="sm" onClick={createNewTask}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 min-w-[150px]"
              />
            </div>
            <Input
              placeholder="Filter by ID..."
              value={ordinalSearch}
              onChange={e => setOrdinalSearch(e.target.value)}
              className="w-24"
            />
            <Popover
              open={isAssigneePopoverOpen}
              onOpenChange={setIsAssigneePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[150px] justify-between">
                  <span className="truncate">
                    {getSelectedAssigneesDisplayText()}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[150px] p-0" align="end">
                {members.map(member => (
                  <div
                    key={member.user_id}
                    role="button"
                    onClick={() => toggleAssignee(member.user_id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent",
                      selectedAssignees.includes(member.user_id) && "bg-accent",
                    )}
                  >
                    <span className="flex-1">
                      {member.profile?.display_name}
                    </span>
                    {selectedAssignees.includes(member.user_id) && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pb-3 flex flex-col overflow-hidden">
          <div className="border rounded-md flex flex-col overflow-hidden h-full">
            {/* Fixed header row that doesn't scroll */}
            <div className="grid grid-cols-[30px_60px_50px_120px_1fr_120px] bg-muted px-2 py-2 text-xs font-medium">
              <div></div>
              <div className="text-center">Priority</div>
              <div className="text-center">ID</div>
              <div>Status</div>
              <div>Title</div>
              <div>Assignee</div>
            </div>

            {/* Scrollable content */}
            <div
              className="overflow-y-auto"
              style={{ maxHeight: "calc(100% - 32px)" }}
            >
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="tasks">
                  {provided => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="divide-y"
                    >
                      {sortedTasks.map((task, index) => {
                        const assigneeProfile = task.assignee_profile;
                        const taskPath = configuration.paths.tasks.view({
                          project_slug: project?.slug,
                          ordinal_id: task.ordinal_id,
                        });

                        return (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {provided => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="grid grid-cols-[30px_60px_50px_120px_1fr_120px] items-center px-2 py-2"
                              >
                                <div {...provided.dragHandleProps}>
                                  <Menu className="size-4 text-gray-500 hover:text-black dark:hover:text-white cursor-grab" />
                                </div>
                                <div className="text-center">
                                  <span className="capitalize text-sm">
                                    <span className="text-base">
                                      {task.ordinal_priority}{" "}
                                    </span>
                                    <span className="text-xs text-gray-600 dark:text-gray-300 lowercase">
                                      {task.ordinal_priority === 1
                                        ? "st"
                                        : task.ordinal_priority === 2
                                          ? "nd"
                                          : task.ordinal_priority === 3
                                            ? "rd"
                                            : "th"}
                                    </span>
                                  </span>
                                </div>
                                <div className="flex justify-center">
                                  <Link
                                    href={taskPath}
                                    className="border-b border-gray-700 dark:border-gray-400 px-1 rounded-bl py-0.5"
                                  >
                                    {task.ordinal_id}
                                  </Link>
                                </div>
                                <div>
                                  <Select
                                    value={task.status}
                                    onValueChange={value =>
                                      handleStatusChange(task.id, value)
                                    }
                                  >
                                    <SelectTrigger className="w-[110px]">
                                      <SelectValue>
                                        <div className="flex items-center gap-1">
                                          <StatusIconSimple
                                            status={task.status}
                                          />
                                          <span className="capitalize text-xs">
                                            {task.status.replace("_", " ")}
                                          </span>
                                        </div>
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[
                                        "backlog",
                                        "todo",
                                        "in_progress",
                                        "in_review",
                                        "completed",
                                      ].map(status => (
                                        <SelectItem key={status} value={status}>
                                          <div className="flex items-center gap-2">
                                            <StatusIconSimple status={status} />
                                            <span className="capitalize">
                                              {status.replace("_", " ")}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="overflow-hidden">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Link
                                          href={taskPath}
                                          className="hover:underline block truncate"
                                        >
                                          {task.title}
                                        </Link>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {task.title}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <div>
                                  <Select
                                    value={task.assignee || "unassigned"}
                                    onValueChange={value =>
                                      handleAssigneeChange(
                                        task.id,
                                        value === "unassigned" ? null : value,
                                      )
                                    }
                                  >
                                    <SelectTrigger className="w-[110px]">
                                      <SelectValue>
                                        <div className="flex items-center gap-1">
                                          <Avatar className="h-5 w-5">
                                            <AvatarImage
                                              src={
                                                assigneeProfile?.avatar_url ||
                                                undefined
                                              }
                                            />
                                            <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-700 dark:text-gray-100">
                                              {assigneeProfile
                                                ? capitalizeFirstLetter(
                                                    assigneeProfile.display_name?.slice(
                                                      0,
                                                      2,
                                                    ) || "??",
                                                  )
                                                : "NA"}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-xs truncate">
                                            {assigneeProfile?.display_name ||
                                              "Unassigned"}
                                          </span>
                                        </div>
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="unassigned">
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-6 w-6">
                                            <AvatarFallback>UA</AvatarFallback>
                                          </Avatar>
                                          <span>Unassigned</span>
                                        </div>
                                      </SelectItem>
                                      {project?.project_members?.map(member => (
                                        <SelectItem
                                          key={member.user_id}
                                          value={member.user_id}
                                        >
                                          <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                              <AvatarImage
                                                src={
                                                  member.profile?.avatar_url ||
                                                  undefined
                                                }
                                              />
                                              <AvatarFallback>
                                                {member.profile?.display_name?.slice(
                                                  0,
                                                  2,
                                                ) || "??"}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span>
                                              {member.profile?.display_name ||
                                                "Unknown User"}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskListCard;
