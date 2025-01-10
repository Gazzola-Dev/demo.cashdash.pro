"use client";
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
import { useSetCurrentProject } from "@/hooks/layout.hooks";
import { cn } from "@/lib/utils";
import { LayoutProject } from "@/types/layout.types";
import { ChevronsUpDown, ListFilter, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

interface ProjectSwitcherProps {
  projects: (LayoutProject & { logo: React.ElementType })[];
}

export function ProjectSwitcher({ projects }: ProjectSwitcherProps) {
  const { isMobile, open } = useSidebar();
  const router = useRouter();
  const setCurrentProject = useSetCurrentProject();

  const initialProject =
    projects.find(project => project.isCurrent) || projects[0];
  const [activeProject, setActiveProject] = React.useState<
    LayoutProject & { logo: React.ElementType }
  >(initialProject);

  const handleProjectSelect = (
    project: LayoutProject & { logo: React.ElementType },
  ) => {
    setCurrentProject.mutate(project.id);
    setActiveProject(project);
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
                <activeProject.logo className="size-4 dark:text-gray-100" />
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
              {projects.map(team => (
                <Tooltip key={team.id}>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem
                      onClick={() => handleProjectSelect(team)}
                      className="cursor-pointer dark:hover:bg-gray-800 dark:focus:bg-gray-800"
                    >
                      <div className="flex size-6 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                        <team.logo className="size-4 shrink-0 dark:text-gray-100" />
                      </div>
                      <div className="ml-2 flex-1 truncate dark:text-gray-100">
                        {team.name}
                      </div>
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="dark:bg-gray-800 dark:text-gray-100"
                  >
                    {team.name}
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
