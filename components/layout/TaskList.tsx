import { StatusIconSimple } from "@/components/tasks/SimpleTaskSelectComponents";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import configuration from "@/configuration";
import useDemoData from "@/hooks/useDemoData";
import { cn } from "@/lib/utils";
import {
  Clock,
  Filter,
  ListIcon,
  Plus,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const PriorityIcon = ({ priority }: { priority: string }) => {
  switch (priority) {
    case "urgent":
      return (
        <Signal className="h-4 w-4 flex-shrink-0 text-rose-500 dark:text-rose-400" />
      );
    case "high":
      return (
        <SignalHigh className="h-4 w-4 flex-shrink-0 text-amber-500 dark:text-amber-400" />
      );
    case "medium":
      return (
        <SignalMedium className="h-4 w-4 flex-shrink-0 text-emerald-500 dark:text-emerald-400" />
      );
    case "low":
      return (
        <SignalLow className="h-4 w-4 flex-shrink-0 text-sky-500 dark:text-sky-400" />
      );
    default:
      return null;
  }
};

type SortOption = {
  field: "priority" | "created_at" | "due_date";
  order: "asc" | "desc";
};

type TaskStatus = "in_review" | "todo" | "backlog" | "draft" | null;

const getIconStyles = (isActive: boolean, isPath = false) => ({
  button: cn(
    "dark:text-gray-200 text-gray-700",
    isActive && isPath
      ? "dark:border border dark:border-blue-700 border-blue-300 dark:bg-black bg-white"
      : isActive
        ? "dark:border border dark:border-gray-700 border-gray-300 dark:bg-black bg-white"
        : "",
  ),
  icon: cn(
    "h-4 w-4 dark:text-gray-400",
    isActive && isPath
      ? "text-blue-500 dark:text-blue-200"
      : isActive
        ? "dark:text-white text-black"
        : "",
  ),
});

const getBorderColorForStatus = (status: TaskStatus) => {
  switch (status) {
    case "in_review":
      return "border-purple-500 dark:border-purple-400";
    case "todo":
      return "border-blue-500 dark:border-blue-400";
    case "backlog":
      return "border-gray-500 dark:border-gray-400";
    case "draft":
      return "border-gray-500 dark:border-gray-400";
    default:
      return "border-transparent";
  }
};

const getStatusDisplayName = (status: TaskStatus) => {
  switch (status) {
    case "in_review":
      return "In Review";
    case "todo":
      return "To Do";
    case "backlog":
      return "Backlog";
    case "draft":
      return "Draft";
    default:
      return null;
  }
};

const TaskList = () => {
  const pathname = usePathname();
  const { open } = useSidebar();
  const [sortConfig, setSortConfig] = useState<SortOption>({
    field: "priority",
    order: "desc",
  });
  const [currentStatus, setCurrentStatus] = useState<TaskStatus>(null);

  const getPriorityValue = (priority: string) => {
    const priorityMap = { urgent: 4, high: 3, medium: 2, low: 1 };
    return priorityMap[priority as keyof typeof priorityMap] || 0;
  };

  const { profile: profileData, project } = useDemoData();
  const tasks = project?.tasks;

  const cycleStatus = () => {
    switch (currentStatus) {
      case null:
        setCurrentStatus("in_review");
        break;
      case "in_review":
        setCurrentStatus("todo");
        break;
      case "todo":
        setCurrentStatus("backlog");
        break;
      case "backlog":
        setCurrentStatus("draft");
        break;
      case "draft":
        setCurrentStatus(null);
        break;
      default:
        setCurrentStatus(null);
    }
  };

  const filteredTasks = tasks
    ?.filter(
      task =>
        task.status !==
        (currentStatus === null
          ? "draft"
          : currentStatus === "draft"
            ? undefined
            : "draft"),
    )
    .filter(task => currentStatus === null || task.status === currentStatus)
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.field) {
        case "priority":
          aValue = getPriorityValue(a.priority);
          bValue = getPriorityValue(b.priority);
          break;
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }

      const multiplier = sortConfig.order === "asc" ? 1 : -1;
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1 * multiplier;
      if (bValue === null) return -1 * multiplier;
      return (aValue - bValue) * multiplier;
    });

  const toggleSort = (field: SortOption["field"]) => {
    setSortConfig(current => ({
      field,
      order:
        current.field === field && current.order === "desc" ? "asc" : "desc",
    }));
  };

  const allTasksPath = configuration.paths.tasks.all({
    project_slug: project?.slug,
  });
  const newTaskPath = configuration.paths.tasks.new({
    project_slug: project?.slug,
  });

  return (
    <SidebarGroup className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-2 pt-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleSort("priority")}
                className={
                  getIconStyles(sortConfig.field === "priority").button
                }
              >
                <Signal
                  className={
                    getIconStyles(sortConfig.field === "priority").icon
                  }
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="dark:bg-gray-800 dark:text-gray-100"
            >
              Sort by priority{" "}
              <span className="font-semibold italic">
                (
                {sortConfig.order === "desc" ? "Highest first" : "Lowest first"}
                )
              </span>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleSort("created_at")}
                className={
                  getIconStyles(sortConfig.field === "created_at").button
                }
              >
                <Clock
                  className={
                    getIconStyles(sortConfig.field === "created_at").icon
                  }
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="dark:bg-gray-800 dark:text-gray-100"
            >
              Sort by creation date{" "}
              <span className="font-semibold italic">
                ({sortConfig.order === "desc" ? "Newest first" : "Oldest first"}
                )
              </span>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={cycleStatus}
                className={cn(
                  "border",
                  getBorderColorForStatus(currentStatus),
                  getIconStyles(!!currentStatus).button,
                )}
              >
                {currentStatus ? (
                  <StatusIconSimple status={currentStatus} />
                ) : (
                  <Filter className={getIconStyles(false).icon} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="dark:bg-gray-800 dark:text-gray-100"
            >
              Filter by status
              {currentStatus && (
                <span className="font-semibold italic">
                  {" "}
                  ({getStatusDisplayName(currentStatus)})
                </span>
              )}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className={
                  getIconStyles(pathname === allTasksPath, true).button
                }
              >
                <Link href={allTasksPath}>
                  <ListIcon
                    className={
                      getIconStyles(pathname === allTasksPath, true).icon
                    }
                  />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="dark:bg-gray-800 dark:text-gray-100"
            >
              View all tasks
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className={getIconStyles(pathname === newTaskPath, true).button}
              >
                <Link href={newTaskPath}>
                  <Plus
                    className={
                      getIconStyles(pathname === newTaskPath, true).icon
                    }
                  />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="dark:bg-gray-800 dark:text-gray-100"
            >
              Create new task
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredTasks?.map(taskData => (
          <SidebarMenuItem key={taskData.id}>
            <Link
              href={configuration.paths.tasks.view({
                project_slug: project?.slug,
                task_slug: taskData.slug,
              })}
              className={cn(
                "flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 select-none",
                "text-sm",
                pathname ===
                  configuration.paths.tasks.view({
                    project_slug: project?.slug,
                    task_slug: taskData.slug,
                  }) && "bg-gray-100 dark:bg-gray-800 font-medium",
              )}
            >
              <div className="flex items-center gap-2">
                <PriorityIcon priority={taskData.priority} />
                <StatusIconSimple status={taskData.status} />
              </div>
              <span className="truncate">
                {open ? (
                  taskData.title
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{taskData.title}</span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="dark:bg-gray-800 dark:text-gray-100"
                      >
                        {taskData.title}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </span>
            </Link>
          </SidebarMenuItem>
        ))}
      </div>
    </SidebarGroup>
  );
};

export default TaskList;
