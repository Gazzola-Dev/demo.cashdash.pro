"use client";

import { signOutAction } from "@/actions/userActions";
import { ProjectSwitcher } from "@/components/layout/ProjectSwitcher";
import RouteBreadcrumb from "@/components/layout/RouteBreadCrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import configuration from "@/configuration";
import { layoutData } from "@/constants/ui.constants";
import {
  AppLayoutProps,
  NavSecondaryProps,
  NavUserProps,
} from "@/types/ui.types";
import {
  Bell,
  ChevronsUpDown,
  CircleUser,
  Clock,
  CreditCard,
  Kanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  UsersRound,
} from "lucide-react";

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1">
              <Menu className="size-4" />
            </SidebarTrigger>
            <Separator orientation="vertical" className="mr-2 h-4" />
            <RouteBreadcrumb />
            <div className="ml-auto flex items-center gap-4">
              <form className="relative">
                <Label htmlFor="search" className="sr-only">
                  Search
                </Label>
                <input
                  id="search"
                  placeholder="Search..."
                  className="h-9 w-64 rounded-md border bg-background px-8 text-sm"
                />
                <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </form>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <main className="rounded-xl bg-background p-6 shadow">
              {children}
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <ProjectSwitcher teams={layoutData.teams} />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Project</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="sm">
                <a
                  href={configuration.paths.project.overview({
                    project_slug: layoutData.teams[0].slug,
                  })}
                >
                  <LayoutDashboard className="size-4" />
                  <span>Overview</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="sm">
                <a
                  href={configuration.paths.project.timeline({
                    project_slug: layoutData.teams[0].slug,
                  })}
                >
                  <Clock className="size-4" />
                  <span>Timeline</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="sm">
                <a
                  href={configuration.paths.project.kanban({
                    project_slug: layoutData.teams[0].slug,
                  })}
                >
                  <Kanban className="size-4" />
                  <span>Kanban</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tasks</SidebarGroupLabel>
          <SidebarMenu>
            {layoutData.recentTasks.map(task => (
              <SidebarMenuItem key={task.url}>
                <SidebarMenuButton asChild size="sm">
                  <a href={task.url}>
                    <span className="truncate">{task.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {layoutData.taskActions.map(action => (
              <SidebarMenuItem key={action.url}>
                <SidebarMenuButton asChild size="sm">
                  <a href={action.url}>{action.title}</a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <NavSecondary items={layoutData.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={layoutData.user} />
      </SidebarFooter>
    </Sidebar>
  );
}

function NavSecondary({ items, className }: NavSecondaryProps) {
  return (
    <SidebarGroup className={className}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(item => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild size="sm">
                <a href={item.url}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
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
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel>
              <div className="flex items-center gap-2 p-1">
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
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <a href={configuration.paths.settings.profile}>
                  <CircleUser className="mr-2 size-4" />
                  Profile
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={configuration.paths.settings.team}>
                  <UsersRound className="mr-2 size-4" />
                  Team
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={configuration.paths.settings.notifications}>
                  <Bell className="mr-2 size-4" />
                  Notifications
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={configuration.paths.settings.billing}>
                  <CreditCard className="mr-2 size-4" />
                  Billing
                </a>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOutAction()}>
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
