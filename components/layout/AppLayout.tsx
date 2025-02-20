"use client";

import LogoText from "@/components/SVG/LogoText";
import NotificationList from "@/components/layout/NotificationList";
import { ProjectSwitcher } from "@/components/layout/ProjectSwitcher";
import RouteBreadcrumb from "@/components/layout/RouteBreadCrumb";
import { SidebarButton } from "@/components/layout/SidebarComponents";
import TaskList from "@/components/layout/TaskList";
import ThemeSwitcher from "@/components/layout/ThemeSwitcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
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
import { capitalizeFirstLetter } from "@/lib/string.util";
import { ProfileWithDetails } from "@/types/profile.types";
import { User } from "@supabase/supabase-js";

import { Dot, Gauge, PanelsRightBottom, Settings } from "lucide-react";
import Link from "next/link";
import React from "react";

interface AppLayoutProps {
  children: React.ReactNode;
  profile?: ProfileWithDetails | null;
  user?: User | null;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center justify-between gap-2">
            <RouteBreadcrumb />
            <Link
              href={configuration.paths.about}
              className="flex items-center justify-center gap-2 h-full pr-[1.1rem]"
            >
              <LogoText className="fill-blue-700 dark:fill-blue-400 w-24 z-10 -mr-1 pt-0.5" />
            </Link>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 justify-between w-full pb-1">
            <main className="flex flex-col items-center overflow-auto">
              {children}
            </main>
            <footer className="flex items-center justify-between w-full text-xs text-gray-500 gap-2">
              <a
                href={"https://cashdash.pro"}
                rel="noopener noreferrer"
                target="_blank"
                className="border-amber-400 dark:border-amber-600 rounded border bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 text-amber-900 dark:text-amber-100 font-semibold"
              >
                You are viewing a demo version of Cash Dash, click here to visit
                the full web app at{" "}
                <span className="tracking-wider underline">CashDash.Pro</span>
              </a>

              <div className="flex items-center gap-2">
                <Link href={configuration.paths.privacy}>Privacy</Link>
                <Dot className="size-3" />
                <Link href={configuration.paths.terms}>Terms</Link>
                <Dot className="size-3" />
                <p className="">&copy; {new Date().getFullYear()} Apex Apps</p>
              </div>
            </footer>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const { open } = useSidebar();
  const { project, profile } = useDemoData();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="border-r dark:border-blue-900">
        <SidebarHeader>
          <ProjectSwitcher />
        </SidebarHeader>
        <SidebarGroup>
          <SidebarMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <SidebarMenuItem>
                    <SidebarButton
                      href={configuration.paths.appHome}
                      matchPattern={configuration.paths.appHome + "$"}
                    >
                      <Gauge className="size-5" />
                      <span>Dashboard</span>
                    </SidebarButton>
                  </SidebarMenuItem>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {open ? "Project roadmap" : "Calendar"}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <SidebarMenuItem>
                    <SidebarButton
                      href={configuration.paths.project.workflow({
                        project_slug: project?.slug,
                      })}
                      matchPattern={configuration.paths.project.workflow({
                        project_slug: project?.slug,
                      })}
                    >
                      <PanelsRightBottom className="size-5" />
                      <span>Workflow</span>
                    </SidebarButton>
                  </SidebarMenuItem>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {open ? "Project roadmap" : "Calendar"}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <SidebarMenuItem>
                    <SidebarButton
                      href={configuration.paths.project.view({
                        project_slug: project?.slug,
                      })}
                      matchPattern={
                        configuration.paths.project.view({
                          project_slug: project?.slug,
                        }) + "$"
                      }
                    >
                      <Settings className="size-5" />
                      <span>Project</span>
                    </SidebarButton>
                  </SidebarMenuItem>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {open ? "Project roadmap" : "Calendar"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </SidebarMenu>
        </SidebarGroup>
        <div className="flex-grow overflow-auto">
          <NotificationList />
          <TaskList />
        </div>

        <SidebarFooter>
          <Tooltip>
            <TooltipTrigger>
              <div className="w-full">
                <ThemeSwitcher />
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="dark:bg-gray-800 dark:text-gray-100"
            >
              Change theme (Dark mode is still in beta!)
            </TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-2 p-1 cursor-pointer dark:hover:bg-gray-800 rounded-md space-x-1.5">
            <Avatar className="size-8 rounded-lg">
              <AvatarImage
                src={profile?.avatar_url ?? ""}
                alt={profile?.display_name ?? "User"}
              />
              <AvatarFallback className="rounded-lg bg-gray-200 dark:bg-gray-700 dark:text-gray-100">
                {capitalizeFirstLetter(
                  profile?.display_name?.slice(0, 2) ??
                    profile?.email.slice(0, 2) ??
                    "?",
                )}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold dark:text-gray-100">
                {capitalizeFirstLetter(
                  profile?.display_name ||
                    profile?.email.split("@")?.[0] ||
                    "Unnamed User",
                )}
              </span>
            </div>
          </div>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}

export default AppLayout;
