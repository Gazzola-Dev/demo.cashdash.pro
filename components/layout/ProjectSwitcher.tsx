// ProjectSwitcher.tsx
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
import configuration from "@/configuration";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, ListFilter, Plus } from "lucide-react";
import Link from "next/link";
import * as React from "react";

type Team = {
  name: string;
  slug: string;
  logo: React.ElementType;
  plan: string;
};

interface ProjectSwitcherProps {
  teams: Team[];
}

export function ProjectSwitcher({ teams }: ProjectSwitcherProps) {
  const { isMobile, open } = useSidebar();
  const [activeTeam, setActiveTeam] = React.useState<Team | null>(
    teams[0] || null,
  );

  if (!activeTeam) return null;

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
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeTeam.name}
                </span>
                <span className="truncate text-xs">{activeTeam.plan}</span>
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
            {teams.map(team => (
              <DropdownMenuItem
                key={team.slug}
                onClick={() => setActiveTeam(team)}
                className="cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <team.logo className="size-4 shrink-0" />
                </div>
                <Link
                  href={configuration.paths.project.overview({
                    project_slug: team.slug,
                  })}
                  className="ml-2 truncate"
                >
                  {team.name}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {team.plan}
                  </span>
                </Link>
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
