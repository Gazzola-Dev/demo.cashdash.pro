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
import useDemoData from "@/hooks/useDemoData";
import { cn } from "@/lib/utils";
import { MailPlus, Plus } from "lucide-react";
import Link from "next/link";

export function ProjectSwitcher() {
  const { isMobile, open } = useSidebar();
  const { projects, project } = useDemoData();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "px-2 h-auto flex items-center justify-between w-full space-x-1 hover:bg-gray-100 dark:hover:bg-gray-800 relative",
                !project && "border border-blue-300",
              )}
            >
              <div
                className={cn(
                  "flex aspect-square size-8 items-center justify-center rounded-lg",
                )}
              >
                <ProjectIcon
                  iconName={project?.icon_name}
                  iconColorFg={project?.icon_color_fg}
                  iconColorBg={project?.icon_color_bg}
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold dark:text-gray-100">
                  {project ? project?.name : "Sign in to get started"}
                </span>
              </div>
              {!open && (
                <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                  <MailPlus className="h-3 w-3 text-primary-foreground" />
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
            <DropdownMenuLabel className="text-sm dark:text-gray-400 pb-3 text-gray-700">
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
                            iconName={p.icon_name}
                            iconColorFg={p.icon_color_fg}
                            iconColorBg={p.icon_color_bg}
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
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default ProjectSwitcher;
