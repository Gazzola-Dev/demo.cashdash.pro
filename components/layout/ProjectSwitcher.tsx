"use client";
import { setCurrentProjectAction } from "@/actions/layout.actions";
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
import configuration from "@/configuration";
import { useToastQueue } from "@/hooks/useToastQueue";
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
  const { toast } = useToastQueue();
  const [activeProject, setActiveProject] = React.useState<
    LayoutProject & { logo: React.ElementType }
  >(projects.find(team => team.isCurrent) || projects[0]);

  const handleProjectSelect = async (
    project: LayoutProject & { logo: React.ElementType },
  ) => {
    try {
      await setCurrentProjectAction(project.id);
      setActiveProject(project);
      router.refresh(); // Refresh the page to update layout data
      toast({
        title: `Switched to ${project.name}`,
      });
    } catch (error) {
      toast({
        title: "Failed to switch project",
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  if (!activeProject) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto w-full p-0">
              <div
                className={cn(
                  "flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground",
                  !open && "ml-1.5 mt-5",
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
          <DropdownMenuContent
            className="w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs">
              My Projects
            </DropdownMenuLabel>
            {projects.map(team => (
              <DropdownMenuItem
                key={team.id}
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
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={configuration.paths.project.all}
                className="cursor-pointer"
              >
                <ListFilter className="mr-2 size-4" />
                All Projects
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={configuration.paths.project.new}
                className="cursor-pointer"
              >
                <Plus className="mr-2 size-4" />
                New Project
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
