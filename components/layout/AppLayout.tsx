"use client";

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
import { useGetProfile } from "@/hooks/profile.hooks";
import { Clock, Dot, Kanban, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface AppLayoutProps {
  children: React.ReactNode;
  projectSlug?: string;
}

export function AppLayout({ children, projectSlug }: AppLayoutProps) {
  const { data: profileData } = useGetProfile();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar profileData={profileData} projectSlug={projectSlug} />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center justify-between gap-2">
            <RouteBreadcrumb />
            <Link
              href={configuration.paths.about}
              className="flex items-center justify-center gap-2 h-full pr-[1.1rem]"
            >
              <Image
                className="w-24 z-10 -mr-1 pt-0.5 dark:hidden"
                src="/svg/brand/logo-with-text-light.svg"
                width={473}
                height={293}
                alt="Cash Dash Pro Logo"
              />
              <Image
                className="w-24 z-10 -mr-1 pt-0.5 hidden dark:block"
                src="/svg/brand/logo-with-text-dark.svg"
                width={473}
                height={293}
                alt="Cash Dash Pro Logo"
              />
            </Link>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 justify-between w-full pb-1">
            <main className="flex flex-col items-center">{children}</main>
            <footer className="flex items-center justify-end w-full text-xs text-gray-500 gap-2">
              <Link href={configuration.paths.privacy}>Privacy</Link>
              <Dot className="size-3" />
              <Link href={configuration.paths.terms}>Terms</Link>
              <Dot className="size-3" />
              <p className="">&copy; {new Date().getFullYear()} Apex Apps</p>
            </footer>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar({
  profileData,
  projectSlug,
}: {
  profileData: any;
  projectSlug?: string;
}) {
  const { open } = useSidebar();
  const currentProject = profileData?.current_project;

  if (!profileData) return null;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="border-r dark:border-blue-900">
        <SidebarHeader>
          <ProjectSwitcher />
        </SidebarHeader>

        {currentProject && (
          <>
            <SidebarGroup>
              <SidebarMenu>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <SidebarMenuItem>
                        <SidebarButton
                          href={configuration.paths.project.overview({
                            project_slug: currentProject.slug,
                          })}
                          matchPattern={`/${currentProject.slug}$`}
                        >
                          <LayoutDashboard className="size-4" />
                          <span>Overview</span>
                        </SidebarButton>
                      </SidebarMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {open
                        ? "View project dashboard and key metrics"
                        : "Overview"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger>
                      <SidebarMenuItem>
                        <SidebarButton
                          href={configuration.paths.project.timeline({
                            project_slug: currentProject.slug,
                          })}
                        >
                          <Clock className="size-4" />
                          <span>Timeline</span>
                        </SidebarButton>
                      </SidebarMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {open ? "View project timeline and schedule" : "Timeline"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger>
                      <SidebarMenuItem>
                        <SidebarButton
                          href={configuration.paths.project.kanban({
                            project_slug: currentProject.slug,
                          })}
                        >
                          <Kanban className="size-4" />
                          <span>Kanban</span>
                        </SidebarButton>
                      </SidebarMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {open ? "Manage tasks in kanban board view" : "Kanban"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </SidebarMenu>
            </SidebarGroup>

            <div className="flex-1 min-h-0">
              <TaskList />
            </div>
          </>
        )}

        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}

export default AppLayout;
