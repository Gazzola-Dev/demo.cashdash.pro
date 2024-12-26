"use client";

import { signOutAction } from "@/actions/user.actions";
import { ProjectSwitcher } from "@/components/layout/ProjectSwitcher";
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
import { useQueryClient } from "@tanstack/react-query";
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
  Settings2,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

interface AppLayoutProps {
  children: React.ReactNode;
  layoutData?: {
    teams: Array<{
      name: string;
      slug: string;
      logo: any;
      plan: string;
    }>;
    user: {
      name: string;
      email: string;
      avatar: string;
    };
    recentTasks: Array<{
      title: string;
      url: string;
    }>;
    navSecondary: Array<{
      title: string;
      url: string;
      icon: string;
    }>;
  };
}

export function AppLayout({ children, layoutData }: AppLayoutProps) {
  // If no layout data (unauthenticated), render children in centered layout
  if (!layoutData) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        {children}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar layoutData={layoutData} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1">
              <Menu className="size-4" />
            </SidebarTrigger>
            <Separator orientation="vertical" className="mr-2 h-4" />
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

function AppSidebar({
  layoutData,
}: Required<Pick<AppLayoutProps, "layoutData">>) {
  const { open } = useSidebar();
  const activeTeam = layoutData.teams[0];

  if (!activeTeam) return null;

  return (
    <Sidebar collapsible="icon">
      <ProjectSwitcher teams={layoutData.teams} />

      <SidebarContent className="mt-4">
        <SidebarGroup>
          <SidebarGroupLabel>Project</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="sm">
                <Link
                  href={configuration.paths.project.overview({
                    project_slug: activeTeam.slug,
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
                    project_slug: activeTeam.slug,
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
                    project_slug: activeTeam.slug,
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
          <SidebarGroupLabel>Recent Tasks</SidebarGroupLabel>
          <SidebarMenu>
            {layoutData.recentTasks.map((task, i) => (
              <SidebarMenuItem key={task.url}>
                <SidebarMenuButton asChild size="sm">
                  <Link href={task.url}>
                    <span>{open ? task.title : `Task ${i + 1}`}</span>
                  </Link>
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

function NavSecondary({
  items,
  className,
}: {
  items: NonNullable<AppLayoutProps["layoutData"]>["navSecondary"];
  className?: string;
}) {
  return (
    <SidebarGroup className={className}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(item => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild size="sm">
                <Link href={item.url}>
                  <Settings2 className="size-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function NavUser({
  user,
}: {
  user: NonNullable<AppLayoutProps["layoutData"]>["user"];
}) {
  const { isMobile } = useSidebar();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await signOutAction();
    queryClient.invalidateQueries({ queryKey: ["user"] });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto p-0">
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
            </Button>
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
                <Link href={configuration.paths.settings.profile}>
                  <CircleUser className="mr-2 size-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={configuration.paths.settings.team}>
                  <UsersRound className="mr-2 size-4" />
                  Team
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={configuration.paths.settings.notifications}>
                  <Bell className="mr-2 size-4" />
                  Notifications
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={configuration.paths.settings.billing}>
                  <CreditCard className="mr-2 size-4" />
                  Billing
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
