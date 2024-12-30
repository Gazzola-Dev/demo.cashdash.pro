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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn("h-auto w-full rounded-lg", open && "p-3")}
                  >
                    <div
                      className={cn(
                        "flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground",
                        !open && "ml-1.5 mt-1.5",
                      )}
                    >
                      <activeProject.logo className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {activeProject.name}
                      </span>
                      <span className="truncate text-xs capitalize">
                        {activeProject.status}
                      </span>
                    </div>
                    <ChevronsUpDown
                      className={cn("ml-auto size-4", !open && "hidden")}
                    />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">
                Switch between projects
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenuContent
            className="w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs">
              My Projects
            </DropdownMenuLabel>
            <TooltipProvider>
              {projects.map(team => (
                <Tooltip key={team.id}>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem
                      onClick={() => handleProjectSelect(team)}
                      className="cursor-pointer"
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <team.logo className="size-4 shrink-0" />
                      </div>
                      <div className="ml-2 flex-1 truncate">
                        {team.name}
                        <span className="ml-auto text-xs capitalize text-muted-foreground">
                          {team.status}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Switch to {team.name}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
            <DropdownMenuSeparator />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuItem asChild>
                    <Link
                      href={configuration.paths.project.all}
                      className="cursor-pointer"
                    >
                      <ListFilter className="mr-2 size-4" />
                      All Projects
                    </Link>
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent side="right">
                  View and manage all projects
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuItem asChild>
                    <Link
                      href={configuration.paths.project.new}
                      className="cursor-pointer"
                    >
                      <Plus className="mr-2 size-4" />
                      New Project
                    </Link>
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent side="right">
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
