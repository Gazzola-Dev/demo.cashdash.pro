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
import { useGetProfile } from "@/hooks/profile.hooks";
import { useListTasks } from "@/hooks/task.hooks";
import { useIsAdmin } from "@/hooks/user.hooks";
import { cn } from "@/lib/utils";
import {
  CalendarRange,
  Clock,
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
        <SignalHigh className="h-4 w-4 text-rose-500 dark:text-rose-400" />
      );
    case "high":
      return <Signal className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
    case "medium":
      return (
        <SignalMedium className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
      );
    case "low":
      return <SignalLow className="h-4 w-4 text-sky-500 dark:text-sky-400" />;
    default:
      return null;
  }
};

type SortOption = {
  field: "priority" | "created_at" | "due_date";
  order: "asc" | "desc";
};

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

const TaskList = () => {
  const { data: profileData } = useGetProfile();
  const pathname = usePathname();
  const isTaskPath = pathname.includes("tasks");
  const { open } = useSidebar();
  const [sortConfig, setSortConfig] = useState<SortOption>({
    field: "priority",
    order: "desc",
  });

  const isAdmin = useIsAdmin();
  const getPriorityValue = (priority: string) => {
    const priorityMap = { urgent: 4, high: 3, medium: 2, low: 1 };
    return priorityMap[priority as keyof typeof priorityMap] || 0;
  };

  const { data: rawTasks = [] } = useListTasks({
    projectSlug: profileData?.current_project?.slug,
    sort:
      sortConfig.field === "priority" || sortConfig.field === "due_date"
        ? "created_at"
        : "created_at",
    order: sortConfig.order,
  });

  const tasks = [...rawTasks]
    .filter(t => t.task.status !== "draft")
    .sort((a, b) => {
      if (sortConfig.field === "priority") {
        const priorityA = getPriorityValue(a.task.priority);
        const priorityB = getPriorityValue(b.task.priority);
        return sortConfig.order === "desc"
          ? priorityB - priorityA
          : priorityA - priorityB;
      } else if (sortConfig.field === "due_date") {
        const dateA = a.task_schedule?.due_date
          ? new Date(a.task_schedule.due_date).getTime()
          : Infinity;
        const dateB = b.task_schedule?.due_date
          ? new Date(b.task_schedule.due_date).getTime()
          : Infinity;
        return sortConfig.order === "desc" ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });

  const toggleSort = (field: SortOption["field"]) => {
    setSortConfig(current => ({
      field,
      order:
        current.field === field && current.order === "desc" ? "asc" : "desc",
    }));
  };

  if (!profileData?.current_project) return null;

  const allTasksPath = configuration.paths.tasks.all({
    project_slug: profileData.current_project.slug,
  });
  const newTaskPath = configuration.paths.tasks.new({
    project_slug: profileData.current_project.slug,
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
              Sort by priority
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
              Sort by creation date
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleSort("due_date")}
                className={
                  getIconStyles(sortConfig.field === "due_date").button
                }
              >
                <CalendarRange
                  className={
                    getIconStyles(sortConfig.field === "due_date").icon
                  }
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="dark:bg-gray-800 dark:text-gray-100"
            >
              Sort by due date
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

          {isAdmin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className={
                    getIconStyles(pathname === newTaskPath, true).button
                  }
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
          )}
        </TooltipProvider>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tasks.map(taskData => (
          <SidebarMenuItem key={taskData.task.id}>
            <Link
              href={configuration.paths.tasks.view({
                project_slug: profileData.current_project?.slug,
                task_slug: taskData.task.slug,
              })}
              className={cn(
                "flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 select-none",
                "text-sm",
                pathname ===
                  configuration.paths.tasks.view({
                    project_slug: profileData.current_project?.slug,
                    task_slug: taskData.task.slug,
                  }) && "bg-gray-100 dark:bg-gray-800 font-medium",
              )}
            >
              <PriorityIcon priority={taskData.task.priority} />
              <span className="truncate">
                {open ? (
                  taskData.task.title
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{taskData.task.title}</span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="dark:bg-gray-800 dark:text-gray-100"
                      >
                        {taskData.task.title}
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
