import { signOutAction } from "@/actions/userActions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsAdmin } from "@/hooks/userHooks";
import {
  Bell,
  ChevronDown,
  Folder,
  Home,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { ReactNode } from "react";

interface NavItem {
  title: string;
  path: string;
  icon: typeof Home | typeof Settings | typeof Folder;
  items?: { title: string; path: string }[];
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1">
        <div className="flex flex-col">
          <AppHeader />
          <div className="flex-1 p-4 md:p-6">{children}</div>
        </div>
      </main>
    </div>
  );
}

function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b">
      <div className="flex h-14 items-center px-4">
        <div className="flex flex-1 items-center justify-between">
          <div className="w-full flex-1" />
          <UserNav />
        </div>
      </div>
    </header>
  );
}

function AppSidebar() {
  const isAdmin = useIsAdmin();

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: Home,
    },
    {
      title: "Projects",
      path: "/projects",
      icon: Folder,
      items: [
        { title: "All Projects", path: "/projects" },
        { title: "Add Project", path: "/projects/new" },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: "Admin",
            path: "/admin",
            icon: Settings,
            items: [
              { title: "Users", path: "/admin/users" },
              { title: "Settings", path: "/admin/settings" },
            ],
          },
        ]
      : []),
  ];

  return (
    <nav className="hidden lg:block w-[300px] border-r px-4 py-6">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold">A</span>
          </div>
          <span className="font-semibold">My AI, Quest</span>
        </div>

        <div className="mt-8 flex flex-1 flex-col gap-4">
          <NavItems items={navItems} />
          <ProjectsList />
        </div>

        <div className="mt-auto">
          <UserNav />
        </div>
      </div>
    </nav>
  );
}

function NavItems({ items }: { items: NavItem[] }) {
  return (
    <div className="space-y-1">
      {items.map(item =>
        item.items ? (
          <Collapsible key={item.path}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                {item.title}
                <ChevronDown className="ml-auto h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              {item.items.map(subItem => (
                <Button
                  key={subItem.path}
                  variant="ghost"
                  className="w-full justify-start pl-8"
                  asChild
                >
                  <a href={subItem.path}>{subItem.title}</a>
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <NavButton key={item.path} item={item} />
        ),
      )}
    </div>
  );
}

function NavButton({ item }: { item: NavItem }) {
  const Icon = item.icon;

  return (
    <Button variant="ghost" className="w-full justify-start" asChild>
      <a href={item.path}>
        <Icon className="mr-2 h-4 w-4" />
        {item.title}
      </a>
    </Button>
  );
}

function ProjectsList() {
  return (
    <div className="space-y-1">
      <h3 className="px-2 text-sm font-medium">Recent Projects</h3>
    </div>
  );
}

function UserNav() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/01.png" alt="@user" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">user@example.com</p>
            <p className="text-xs text-muted-foreground">User Account</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOutAction()}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AppLayout;
