"use client";

import LogoText from "@/components/SVG/LogoText";
import NavUser from "@/components/layout/NavUser";
import { ProjectSwitcher } from "@/components/layout/ProjectSwitcher";
import RouteBreadcrumb from "@/components/layout/RouteBreadCrumb";
import { SidebarButton } from "@/components/layout/SidebarComponents";
import TaskList from "@/components/layout/TaskList";
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
import { cn } from "@/lib/utils";
import { ProfileWithDetails } from "@/types/profile.types";
import { User } from "@supabase/supabase-js";

import {
  Dot,
  Gauge,
  GitPullRequestDraft,
  Settings,
  Settings2,
} from "lucide-react";
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
            <main className="flex flex-col items-center">{children}</main>
            <footer className="flex items-center justify-between w-full text-xs text-gray-500 gap-2">
              <a
                href={"https://cashdash.pro"}
                rel="noopener noreferrer"
                target="_blank"
                className="border-amber-400 rounded border bg-amber-50 px-1.5 py-0.5 text-amber-900 font-semibold"
              >
                You are viewing a demo version of Cash Dash, click here to visit
                the full web app at{" "}
                <span className="font-bold italic underline">CashDash.Pro</span>
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
  const { project } = useDemoData();

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

              {/* <Tooltip>
                <TooltipTrigger>
                  <SidebarMenuItem>
                    <SidebarButton
                      href={configuration.paths.project.deployments({
                        project_slug: project?.slug,
                      })}
                      matchPattern={configuration.paths.project.deployments({
                        project_slug: project?.slug,
                      })}
                    >
                      <Rocket className="size-5" />
                      <span>Deployments</span>
                    </SidebarButton>
                  </SidebarMenuItem>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {open ? "Preview deployments" : "Prototype"}
                </TooltipContent>
              </Tooltip> */}
              <Tooltip>
                <TooltipTrigger>
                  <SidebarMenuItem>
                    <SidebarButton
                      href={configuration.paths.project.timeline({
                        project_slug: project?.slug,
                      })}
                      matchPattern={configuration.paths.project.timeline({
                        project_slug: project?.slug,
                      })}
                    >
                      <GitPullRequestDraft className="size-5" />
                      <span>Timeline</span>
                    </SidebarButton>
                  </SidebarMenuItem>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {open ? "Project roadmap" : "Calendar"}
                </TooltipContent>
              </Tooltip>
              {/* <Tooltip>
                <TooltipTrigger>
                  <SidebarMenuItem>
                    <SidebarButton
                      href={configuration.paths.project.kanban({
                        project_slug: project?.slug,
                      })}
                      matchPattern={configuration.paths.project.kanban({
                        project_slug: project?.slug,
                      })}
                    >
                      <Kanban className="size-5" />
                      <span>Kanban</span>
                    </SidebarButton>
                  </SidebarMenuItem>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {open ? "Preview deployments" : "Prototype"}
                </TooltipContent>
              </Tooltip> */}

              {/* <Tooltip>
                <TooltipTrigger>
                  <SidebarMenuItem>
                    <SidebarButton
                      href={configuration.paths.project.contracts({
                        project_slug: project?.slug,
                      })}
                      matchPattern={configuration.paths.project.contracts({
                        project_slug: project?.slug,
                      })}
                    >
                      <Signature className="size-5" />
                      <span>Contracts</span>
                    </SidebarButton>
                  </SidebarMenuItem>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {open ? "Preview deployments" : "Prototype"}
                </TooltipContent>
              </Tooltip> */}

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
                      <Settings2 className="size-5" />
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
        <div className="px-4 pt-4 space-y-2.5">
          <h3
            className={cn(
              "text-sm text-gray-800 dark:text-gray-200 font-medium",
            )}
          >
            Tasks
          </h3>
          <hr className={cn("w-full dark:border-gray-00")} />
        </div>
        <div className="flex-1 min-h-0">
          <TaskList />
        </div>

        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}

export default AppLayout;
