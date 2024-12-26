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
import { useSignOut } from "@/hooks/user.hooks";
import { LayoutData, NavigationItem } from "@/types/layout.types";
import {
  Bell,
  ChevronsUpDown,
  CircleUser,
  Clock,
  Code2,
  CreditCard,
  Kanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings2,
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

      {!currentProject ? (
        <div className="relative flex h-full flex-col">
          <div className="absolute inset-0 backdrop-blur-sm" />
          <div className="relative z-10 mx-auto mt-3.5 flex w-[calc(100%-1rem)] flex-col items-center pr-0.5">
            <Button
              asChild
              size="sm"
              className={open ? "w-full" : "h-8 w-8 p-0"}
            >
              <Link href={configuration.paths.project.new}>
                <Plus className="size-4" />
                {open && <span>New Project</span>}
                {!open && <span className="sr-only">New Project</span>}
              </Link>
            </Button>
          </div>
          {open && (
            <SidebarContent className="mt-4 opacity-50">
              <NavPlaceholderContent />
            </SidebarContent>
          )}
        </div>
      ) : (
        <SidebarContent className="mt-4">
          <SidebarGroup>
            <SidebarGroupLabel>Project</SidebarGroupLabel>
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
            <SidebarGroupLabel>Recent Tasks</SidebarGroupLabel>
            <SidebarMenu>
              {layoutData.recentTasks.map((task, i) => (
                <SidebarMenuItem key={task.id}>
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
      )}

      <SidebarFooter>
        <NavUser user={layoutData.user} />
      </SidebarFooter>
    </Sidebar>
  );
}

// Helper component to show placeholder content when no project is selected
function NavPlaceholderContent() {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Project</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm">
              <LayoutDashboard className="size-4" />
              <span>Overview</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm">
              <Clock className="size-4" />
              <span>Timeline</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm">
              <Kanban className="size-4" />
              <span>Kanban</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Recent Tasks</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm">
              <span>No tasks yet</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}

function NavSecondary({
  items,
  className,
}: {
  items: NavigationItem[];
  className?: string;
}) {
  return (
    <SidebarGroup className={className}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(item => {
            const Icon = item.icon || Settings2;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild size="sm">
                  <Link href={item.url}>
                    <Icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
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

export default AppLayout;
