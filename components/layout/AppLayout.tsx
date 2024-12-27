// AppLayout.tsx
import { ProjectSwitcher } from "@/components/layout/ProjectSwitcher";
import RouteBreadcrumb from "@/components/layout/RouteBreadCrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import configuration from "@/configuration";
import { useSignOut } from "@/hooks/user.hooks";
import { cn } from "@/lib/utils";
import { LayoutData } from "@/types/layout.types";
import { Tooltip } from "@radix-ui/react-tooltip";
import {
  ArrowRight,
  Bell,
  ChevronsUpDown,
  CircleAlert,
  CircleUser,
  Clock,
  Code2,
  CreditCard,
  Kanban,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Send,
  Settings2,
  Signal,
  SignalHigh,
  SignalMedium,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import React from "react";

interface AppLayoutProps {
  children: React.ReactNode;
  layoutData: LayoutData;
}

export function AppLayout({ children, layoutData }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar layoutData={layoutData} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1">
              <Menu className="size-4" />
            </SidebarTrigger>
            {layoutData.currentProject && (
              <h3 className="text-sm">
                {layoutData.currentProject.name.length > 10
                  ? `${layoutData.currentProject.name.slice(0, 10)}...`
                  : layoutData.currentProject.name}
              </h3>
            )}
            <RouteBreadcrumb layoutData={layoutData} />
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <main className="flex flex-col items-center">{children}</main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar({ layoutData }: { layoutData: LayoutData }) {
  const { open } = useSidebar();
  const currentProject = layoutData.currentProject;

  const projectsWithLogos = layoutData.projects.map(project => ({
    ...project,
    logo: Code2,
  }));

  return (
    <Sidebar collapsible="icon">
      <ProjectSwitcher projects={projectsWithLogos} />

      <SidebarContent className="">
        {currentProject && (
          <>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild size="sm">
                    <Link
                      href={configuration.paths.project.overview({
                        project_slug: currentProject.slug,
                      })}
                    >
                      <LayoutDashboard className="size-4" />
                      <span>Overview</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild size="sm">
                    <Link
                      href={configuration.paths.project.timeline({
                        project_slug: currentProject.slug,
                      })}
                    >
                      <Clock className="size-4" />
                      <span>Timeline</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild size="sm">
                    <Link
                      href={configuration.paths.project.kanban({
                        project_slug: currentProject.slug,
                      })}
                    >
                      <Kanban className="size-4" />
                      <span>Kanban</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between">
                <h2 className="text-sm">Tasks</h2>
                <Link
                  className="flex items-center gap-2 text-gray-500 text-xs"
                  href={configuration.paths.tasks.all({
                    project_slug: currentProject.slug,
                  })}
                >
                  <span className="italic font-mediu">View all</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </SidebarGroupLabel>
              <SidebarMenu>
                <TooltipProvider>
                  {layoutData.priorityTasks.map((task, i) => (
                    <Tooltip key={task.id}>
                      <TooltipTrigger>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild size="sm">
                            <Link href={task.url}>
                              {!open ? (
                                task.prefix
                              ) : task.priority === "high" ? (
                                <Signal className="size-4" />
                              ) : task.priority === "medium" ? (
                                <SignalHigh className="size-4" />
                              ) : task.priority === "low" ? (
                                <SignalMedium className="size-4" />
                              ) : task.priority === "urgent" ? (
                                <CircleAlert className="size-4" />
                              ) : null}
                              <span>{open ? task.title : `Task ${i + 1}`}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </TooltipTrigger>
                      <TooltipContent>{task.title}</TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </SidebarMenu>
            </SidebarGroup>
          </>
        )}
        <NavSecondary className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={layoutData.user} />
      </SidebarFooter>
    </Sidebar>
  );
}

function NavSecondary({ className }: { className?: string }) {
  return (
    <SidebarGroup className={className}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
              <Link href={configuration.paths.settings.all}>
                <Settings2 className="size-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
              <Link href={configuration.paths.settings.all}>
                <Send className="size-4" />
                <span>Feedback</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
              <Link href={configuration.paths.settings.all}>
                <LifeBuoy className="size-4" />
                <span>Support</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function NavUser({ user }: { user: LayoutData["user"] }) {
  const { isMobile } = useSidebar();
  const { mutate: signOut } = useSignOut();

  const { open } = useSidebar();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-auto flex items-center justify-between w-full",
                open ? "p-2" : "p-0",
              )}
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              {open && <ChevronsUpDown className="ml-auto size-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel>
              <Link
                href={configuration.paths.settings.profile}
                className="flex items-center gap-2 p-1 cursor-pointer"
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm">
                  <span className="font-semibold">{user.name}</span>
                  <span className="text-xs">{user.email}</span>
                </div>
              </Link>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href={configuration.paths.settings.profile}>
                  <CircleUser className="mr-2 size-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href={configuration.paths.settings.team}>
                  <UsersRound className="mr-2 size-4" />
                  Team
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href={configuration.paths.settings.notifications}>
                  <Bell className="mr-2 size-4" />
                  Notifications
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href={configuration.paths.settings.billing}>
                  <CreditCard className="mr-2 size-4" />
                  Billing
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default AppLayout;
