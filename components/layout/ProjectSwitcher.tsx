"use client";

import ProjectSwitcherSkeleton from "@/components/layout/ProjectSwitcherLoadingSkeleton";
import { default as ProjectIcon } from "@/components/projects/ProjectIcon";
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
import { cn } from "@/lib/utils";
import { useAppData } from "@/stores/app.store";
import { Book, BookOpenText, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function ProjectSwitcher() {
  const { isMobile, open, setOpen } = useSidebar();
  const { projects, project, profile, user, isAdmin } = useAppData();
  const [isOpen, setIsOpen] = useState(false);

  // Loading state determination
  const isLoading = !user || !profile;

  const toggleSidebar = () => {
    setOpen(!open);
  };

  if (isLoading) {
    return <ProjectSwitcherSkeleton />;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem
        className={cn(
          "flex items-center",
          open ? "justify-between" : "flex-col gap-2",
        )}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={toggleSidebar}
                className={cn(open ? "" : "w-full")}
              >
                {open ? (
                  <BookOpenText className="size-5" />
                ) : (
                  <Book className="size-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {open ? "Collapse sidebar" : "Expand sidebar"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu
          onOpenChange={open => setIsOpen(!!profile && open)}
          open={isOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 relative",
                open
                  ? "px-2 h-auto w-full space-x-1"
                  : "p-2 h-auto w-10 aspect-square",
              )}
            >
              <div
                className={cn(
                  "flex aspect-square items-center justify-center rounded-lg",
                  open ? "size-8" : "size-6",
                )}
              >
                <ProjectIcon />
              </div>
              {open && (
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold dark:text-gray-100">
                    {project ? project?.name : "Sign in to get started"}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-lg dark:bg-gray-900 dark:border-gray-800 px-2 py-2.5"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-sm pb-3 text-gray-500 dark:text-gray-400">
              My Projects
            </DropdownMenuLabel>
            <TooltipProvider>
              {projects.map(p => (
                <Tooltip key={p.id}>
                  <TooltipTrigger asChild>
                    <Link
                      href={configuration.paths.project.view({
                        project_slug: p.slug,
                      })}
                    >
                      <DropdownMenuItem
                        className={cn(
                          "py-2.5 cursor-pointer dark:hover:bg-gray-800 dark:focus:bg-gray-800 rounded",
                          project?.id === p.id &&
                            "border-r-2 border-primary bg-sidebar-accent text-sidebar-accent-foreground",
                        )}
                      >
                        <div className="flex size-6 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                          <ProjectIcon
                            project={p}
                            className="size-4 shrink-0 dark:text-gray-100"
                          />
                        </div>
                        <div className="ml-2 flex-1 truncate dark:text-gray-100">
                          {p.name}
                        </div>
                      </DropdownMenuItem>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="dark:bg-gray-800 dark:text-gray-100"
                  >
                    {p.name}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
            <DropdownMenuSeparator className="dark:border-gray-700" />

            {isAdmin && (
              <TooltipProvider>
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
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default ProjectSwitcher;
