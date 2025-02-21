import { StatusIconSimple } from "@/components/tasks/SimpleTaskSelectComponents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import configuration from "@/configuration";
import useDemoData from "@/hooks/useDemoData";
import { capitalizeFirstLetter } from "@/lib/string.util";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

type TaskStatus = "in-progress" | "to-do" | "blocked" | "reviewing" | string;

const TaskList = () => {
  const pathname = usePathname();
  const { project } = useDemoData();

  // Sort tasks by ordinal_priority (higher numbers first)
  const sortedTasks = project?.tasks
    ?.map(t => t.task)
    ?.sort((a, b) => a.ordinal_priority - b.ordinal_priority)
    ?.filter(t => !["completed", "draft"].includes(t.status));

  if (!sortedTasks?.length) {
    return null;
  }

  const getOrdinalSuffix = (number: number) => {
    if (number === 1) return "st";
    if (number === 2) return "nd";
    if (number === 3) return "rd";
    return "th";
  };

  const getStatusText = (status: TaskStatus) => {
    const statusMap: Record<string, string> = {
      "in-progress": "In Progress",
      "to-do": "To Do",
      blocked: "Blocked",
      reviewing: "In Review",
    };
    return statusMap[status] || capitalizeFirstLetter(status);
  };

  return (
    <div className="px-4 space-y-2 mt-4">
      <h3
        className={cn("text-sm text-gray-800 dark:text-gray-200 font-medium")}
      >
        Tasks ({sortedTasks.length})
      </h3>
      <hr className={cn("w-full dark:border-blue-900")} />

      <div className="flex-1 overflow-y-auto">
        <TooltipProvider>
          {sortedTasks.map(task => {
            const taskPath = configuration.paths.tasks.view({
              project_slug: project?.slug,
              task_slug: task.slug,
            });
            const isActive = pathname === taskPath;
            const assigneeProfile = project?.tasks.find(
              t => t.task.id === task.id,
            )?.assignee_profile;

            return (
              <SidebarMenuItem key={task.id}>
                <Link
                  href={taskPath}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 select-none",
                    "text-sm",
                    isActive && "bg-gray-100 dark:bg-gray-800 font-medium",
                  )}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-gray-500 dark:text-gray-200 w-4 rounded">
                        {task.ordinal_priority}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      This task is the {task.ordinal_priority}
                      {getOrdinalSuffix(task.ordinal_priority)} highest priority
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <StatusIconSimple status={task.status} />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Status: {getStatusText(task.status)}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex-1 truncate">
                        <span className="border border-gray-500 px-1 rounded">
                          {task.slug.toUpperCase().split("-").join("")}
                        </span>{" "}
                        {task.title}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right">{task.title}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={assigneeProfile?.avatar_url || undefined}
                        />
                        <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-700 dark:text-gray-100">
                          {assigneeProfile
                            ? capitalizeFirstLetter(
                                assigneeProfile.display_name?.slice(0, 2) ||
                                  "??",
                              )
                            : "NA"}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Assigned to:{" "}
                      {assigneeProfile?.display_name || "Unassigned"}
                    </TooltipContent>
                  </Tooltip>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
};

export default TaskList;
