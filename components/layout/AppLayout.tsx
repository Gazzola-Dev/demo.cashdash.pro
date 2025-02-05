"use client";

import NavUser from "@/components/layout/NavUser";
import { ProjectSwitcher } from "@/components/layout/ProjectSwitcher";
import RouteBreadcrumb from "@/components/layout/RouteBreadCrumb";
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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import configuration from "@/configuration";
import { useGetProfile } from "@/hooks/profile.hooks";
import { cn } from "@/lib/utils";
import { ClockIcon, KanbanIcon, LayoutDashboardIcon, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import ThemeSwitcher from "./ThemeSwitcher";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { data: profileData } = useGetProfile();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarContent className="border-r dark:border-blue-900 flex flex-col h-full">
            <SidebarHeader>
              <ProjectSwitcher />
            </SidebarHeader>

            {profileData?.current_project && (
              <>
                <SidebarGroup>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <Link
                        href={configuration.paths.project.overview({
                          project_slug: profileData.current_project.slug,
                        })}
                        className={cn(
                          "flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800",
                          "text-sm font-medium",
                        )}
                      >
                        <LayoutDashboardIcon className="h-4 w-4" />
                        <span>Overview</span>
                      </Link>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <Link
                        href={configuration.paths.project.timeline({
                          project_slug: profileData.current_project.slug,
                        })}
                        className={cn(
                          "flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800",
                          "text-sm font-medium",
                        )}
                      >
                        <ClockIcon className="h-4 w-4" />
                        <span>Timeline</span>
                      </Link>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <Link
                        href={configuration.paths.project.kanban({
                          project_slug: profileData.current_project.slug,
                        })}
                        className={cn(
                          "flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800",
                          "text-sm font-medium",
                        )}
                      >
                        <KanbanIcon className="h-4 w-4" />
                        <span>Kanban</span>
                      </Link>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroup>

                <div className="flex-1 min-h-0">
                  <TaskList />
                </div>
              </>
            )}

            <SidebarFooter className="mt-auto">
              <ThemeSwitcher />
              <NavUser />
            </SidebarFooter>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1">
          <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b">
            <div className="flex items-center">
              <SidebarTrigger className="p-3">
                <Menu className="h-4 w-4" />
              </SidebarTrigger>
              <RouteBreadcrumb />
            </div>
            <div className="flex items-center justify-center gap-2 h-full pr-4">
              <Image
                className="w-24 z-10 -mr-1 pt-0.5 dark:hidden"
                src="/svg/brand/logo-with-text-light.svg"
                width={473}
                height={293}
                alt="Logo"
              />
              <Image
                className="w-24 z-10 -mr-1 pt-0.5 hidden dark:block"
                src="/svg/brand/logo-with-text-dark.svg"
                width={473}
                height={293}
                alt="Logo"
              />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default AppLayout;
