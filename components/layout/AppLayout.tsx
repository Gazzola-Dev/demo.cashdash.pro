"use client";

import NavUser from "@/components/layout/NavUser";
import { ProjectSwitcher } from "@/components/layout/ProjectSwitcher";
import RouteBreadcrumb from "@/components/layout/RouteBreadCrumb";
import { SidebarButton } from "@/components/layout/SidebarComponents";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import configuration from "@/configuration";
import { useGetProfile } from "@/hooks/profile.hooks";
import { Tooltip } from "@radix-ui/react-tooltip";
import {
  Clock,
  Dot,
  Kanban,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  PlusIcon,
  Send,
  Settings2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface AppLayoutProps {
  children: React.ReactNode;
  projectSlug?: string;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { data: profileData } = useGetProfile();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarContent className="border-r dark:border-blue-900">
            <SidebarHeader>
              <ProjectSwitcher />
            </SidebarHeader>
            {profileData?.current_project && (
              <>
                <SidebarGroup>
                  <SidebarMenu>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <SidebarMenuItem>
                            <SidebarButton
                              href={configuration.paths.project.overview({
                                project_slug: profileData.current_project.slug,
                              })}
                              matchPattern={`/${profileData.current_project.slug}$`}
                            >
                              <LayoutDashboard className="size-4" />
                              <span>Overview</span>
                            </SidebarButton>
                          </SidebarMenuItem>
                        </TooltipTrigger>
                        <TooltipContent side="right">Overview</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger>
                          <SidebarMenuItem>
                            <SidebarButton
                              href={configuration.paths.project.timeline({
                                project_slug: profileData.current_project.slug,
                              })}
                            >
                              <Clock className="size-4" />
                              <span>Timeline</span>
                            </SidebarButton>
                          </SidebarMenuItem>
                        </TooltipTrigger>
                        <TooltipContent side="right">Timeline</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger>
                          <SidebarMenuItem>
                            <SidebarButton
                              href={configuration.paths.project.kanban({
                                project_slug: profileData.current_project.slug,
                              })}
                            >
                              <Kanban className="size-4" />
                              <span>Kanban</span>
                            </SidebarButton>
                          </SidebarMenuItem>
                        </TooltipTrigger>
                        <TooltipContent side="right">Kanban</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenu>
                </SidebarGroup>

                <SidebarGroup>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <SidebarMenuItem>
                          <SidebarButton
                            href={configuration.paths.tasks.all({
                              project_slug: profileData.current_project.slug,
                            })}
                            matchPattern={`/${profileData.current_project.slug}/tasks$`}
                          >
                            <div className="flex w-full items-center justify-between gap-2">
                              <h2 className="text-sm font-medium">Tasks</h2>
                              <Button variant="ghost" size="icon" asChild>
                                <Link
                                  href={configuration.paths.tasks.new({
                                    project_slug:
                                      profileData.current_project.slug,
                                  })}
                                >
                                  <PlusIcon className="size-4" />
                                </Link>
                              </Button>
                            </div>
                          </SidebarButton>
                        </SidebarMenuItem>
                      </TooltipTrigger>
                      <TooltipContent side="right">Manage Tasks</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </SidebarGroup>
              </>
            )}

            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <SidebarMenuItem>
                          <SidebarButton
                            href={configuration.paths.settings.all}
                          >
                            <Settings2 className="size-4" />
                            <span>Settings</span>
                          </SidebarButton>
                        </SidebarMenuItem>
                      </TooltipTrigger>
                      <TooltipContent side="right">Settings</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger>
                        <SidebarMenuItem>
                          <SidebarButton href={configuration.paths.feedback}>
                            <Send className="size-4" />
                            <span>Feedback</span>
                          </SidebarButton>
                        </SidebarMenuItem>
                      </TooltipTrigger>
                      <TooltipContent side="right">Feedback</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger>
                        <SidebarMenuItem>
                          <SidebarButton href={configuration.paths.support}>
                            <LifeBuoy className="size-4" />
                            <span>Support</span>
                          </SidebarButton>
                        </SidebarMenuItem>
                      </TooltipTrigger>
                      <TooltipContent side="right">Support</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarFooter>
              <NavUser />
            </SidebarFooter>
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-12 shrink-0 items-start justify-between gap-2">
            <div className="flex">
              <SidebarTrigger className="p-6 hover:bg-gray-100 rounded-t-none rounded-l-none">
                <Menu className="size-4" />
              </SidebarTrigger>
              <RouteBreadcrumb />
            </div>
            <div className="flex items-center justify-center gap-2 h-full pr-[1.1rem]">
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
              <Image
                className="w-8 z-10 -mr-1 dark:hidden"
                src="/svg/brand/logo-light.svg"
                width={473}
                height={293}
                alt="Cash Dash Pro Logo"
              />
              <Image
                className="w-8 z-10 -mr-1 hidden dark:block"
                src="/svg/brand/logo-dark.svg"
                width={473}
                height={293}
                alt="Cash Dash Pro Logo"
              />
            </div>
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

export default AppLayout;
