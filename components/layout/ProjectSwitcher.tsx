import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
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
import { useGetProfile, useUpdateProfile } from "@/hooks/profile.hooks";
import { useListProjects } from "@/hooks/project.hooks";
import { cn } from "@/lib/utils";
import { ProjectWithDetails } from "@/types/project.types";
import { ChevronsUpDown, Code2, ListFilter, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

export function ProjectSwitcher() {
  const { isMobile, open } = useSidebar();
  const router = useRouter();
  const { data: profileData } = useGetProfile();
  const { data: projects = [] } = useListProjects();
  const { mutate: updateProfile } = useUpdateProfile();

  // Get active project based on current_project_id
  const activeProject = React.useMemo(
    () =>
      projects.find(p => p.id === profileData?.profile.current_project_id) ||
      projects[0],
    [projects, profileData?.profile.current_project_id],
  );

  const handleProjectSelect = (project: ProjectWithDetails) => {
    updateProfile({ current_project_id: project.id });
    router.refresh();
  };

  if (!activeProject) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-auto flex items-start justify-between w-full",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                open ? "px-1 py-2" : "p-0",
              )}
            >
              <div
                className={cn(
                  "flex aspect-square size-8 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700",
                  !open && "ml-1.5 mt-1.5",
                )}
              >
                <Code2 className="size-4 dark:text-gray-100" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold dark:text-gray-100">
                  {activeProject.name}
                </span>
                <span className="truncate text-xs capitalize dark:text-gray-400">
                  {activeProject.status}
                </span>
              </div>
              {open && (
                <ChevronsUpDown className="ml-auto size-4 dark:text-gray-400" />
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-56 rounded-lg dark:bg-gray-900 dark:border-gray-800"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs dark:text-gray-400">
              My Projects
            </DropdownMenuLabel>
            <TooltipProvider>
              {projects.map(project => (
                <Tooltip key={project.id}>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem
                      onClick={() => handleProjectSelect(project)}
                      className="cursor-pointer dark:hover:bg-gray-800 dark:focus:bg-gray-800"
                    >
                      <div className="flex size-6 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                        <Code2 className="size-4 shrink-0 dark:text-gray-100" />
                      </div>
                      <div className="ml-2 flex-1 truncate dark:text-gray-100">
                        {project.name}
                      </div>
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="dark:bg-gray-800 dark:text-gray-100"
                  >
                    {project.name}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
            <DropdownMenuSeparator className="dark:border-gray-700" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuItem
                    className="cursor-pointer dark:hover:bg-gray-800 dark:focus:bg-gray-800"
                    asChild
                  >
                    <Link
                      href={configuration.paths.project.all}
                      className="dark:text-gray-100"
                    >
                      <ListFilter className="mr-2 size-4 dark:text-gray-400" />
                      All Projects
                    </Link>
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="dark:bg-gray-800 dark:text-gray-100"
                >
                  View and manage all projects
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuItem
                    className="cursor-pointer dark:hover:bg-gray-800 dark:focus:bg-gray-800"
                    asChild
                  >
                    <Link
                      href={configuration.paths.project.new}
                      className="dark:text-gray-100"
                    >
                      <Plus className="mr-2 size-4 dark:text-gray-400" />
                      New Project
                    </Link>
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="dark:bg-gray-800 dark:text-gray-100"
                >
                  Create a new project
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default ProjectSwitcher;
