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
import useAppStore from "@/hooks/app.store";
import { useGetUserInvites } from "@/hooks/query.hooks";
import { useIsAdmin } from "@/hooks/user.hooks";
import { cn } from "@/lib/utils";
import { Code2, ListFilter, LogIn, MailPlus, Plus } from "lucide-react";
import Link from "next/link";

export function ProjectSwitcher() {
  const isAdmin = useIsAdmin();
  const { isMobile, open } = useSidebar();
  const { data: invites } = useGetUserInvites();
  const { profile: profileData, currentProject } = useAppStore();

  const hasPendingInvites = !!invites?.invitations?.length;

  const triggerButton = (
    <Button
      variant="ghost"
      className={cn(
        "h-auto flex items-center justify-between w-full space-x-1 hover:bg-gray-100 dark:hover:bg-gray-800 relative",
        !currentProject && "border border-blue-300",
      )}
    >
      <div
        className={cn(
          "flex aspect-square size-8 items-center justify-center rounded-lg",
          !open && "ml-1.5 mt-1.5",
          currentProject
            ? "bg-gray-200 dark:bg-gray-700"
            : "border border-blue-500",
        )}
      >
        {currentProject ? (
          <Code2 className="size-4 dark:text-gray-100" />
        ) : hasPendingInvites ? (
          <MailPlus className="text-blue-500" />
        ) : (
          <LogIn className="size-4 text-blue-500" />
        )}
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold dark:text-gray-100">
          {currentProject
            ? currentProject?.name
            : hasPendingInvites
              ? "View invitations"
              : "Sign in to get started"}
        </span>
      </div>
      {!open && hasPendingInvites && (
        <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
          <MailPlus className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
    </Button>
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={profileData ? undefined : false}>
          <DropdownMenuTrigger asChild>
            {!profileData ? (
              <Link href={configuration.paths.appHome}>{triggerButton}</Link>
            ) : (
              triggerButton
            )}
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
              {profileData?.projects.map(p => (
                <Tooltip key={p.project.id}>
                  <TooltipTrigger asChild>
                    <Link
                      href={configuration.paths.project.overview({
                        project_slug: p.project.slug,
                      })}
                    >
                      <DropdownMenuItem className="cursor-pointer dark:hover:bg-gray-800 dark:focus:bg-gray-800">
                        <div className="flex size-6 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                          <Code2 className="size-4 shrink-0 dark:text-gray-100" />
                        </div>
                        <div className="ml-2 flex-1 truncate dark:text-gray-100">
                          {p.project.name}
                        </div>
                      </DropdownMenuItem>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="dark:bg-gray-800 dark:text-gray-100"
                  >
                    {p.project.name}
                  </TooltipContent>
                </Tooltip>
              ))}

              {invites?.invitations.map(invite => (
                <Tooltip key={invite.id}>
                  <TooltipTrigger asChild>
                    <Link
                      href={`/${invite.project.slug}/invite`}
                      className="relative"
                    >
                      <DropdownMenuItem
                        className={cn(
                          "cursor-pointer dark:hover:bg-gray-800 dark:focus:bg-gray-800 rounded",
                          !currentProject &&
                            "bg-blue-500/5 border border-blue-200",
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-6 items-center justify-center rounded-lg",
                            currentProject && "bg-gray-100 dark:bg-gray-700",
                          )}
                        >
                          <MailPlus className="size-4 shrink-0 text-blue-500" />
                        </div>
                        <div className="ml-2 flex-1 truncate dark:text-gray-100">
                          {invite.project.name}
                        </div>
                      </DropdownMenuItem>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="dark:bg-gray-800 dark:text-gray-100"
                  >
                    You&apos;ve been invited to join this project
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
              {isAdmin && (
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
              )}
            </TooltipProvider>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default ProjectSwitcher;
