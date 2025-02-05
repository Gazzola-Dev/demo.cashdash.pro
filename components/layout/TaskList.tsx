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
import { cn } from "@/lib/utils";
import { ListIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TaskList = () => {
  const { data: profileData } = useGetProfile();
  const pathname = usePathname();
  const { open } = useSidebar();

  const { data: tasks = [] } = useListTasks({
    projectSlug: profileData?.current_project?.slug,
    sort: "ordinal_id",
    order: "asc",
  });

  if (!profileData?.current_project) return null;

  return (
    <SidebarGroup className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium">Tasks</h2>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link
                    href={configuration.paths.tasks.all({
                      project_slug: profileData.current_project.slug,
                    })}
                  >
                    <ListIcon className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">View all tasks</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link
                    href={configuration.paths.tasks.new({
                      project_slug: profileData.current_project.slug,
                    })}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Create new task</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
                "flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800",
                "text-sm",
                pathname ===
                  configuration.paths.tasks.view({
                    project_slug: profileData.current_project?.slug,
                    task_slug: taskData.task.slug,
                  }) && "bg-gray-100 dark:bg-gray-800 font-medium",
              )}
            >
              <span className="truncate">
                {open ? (
                  taskData.task.title
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{taskData.task.title}</span>
                      </TooltipTrigger>
                      <TooltipContent side="right">
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
