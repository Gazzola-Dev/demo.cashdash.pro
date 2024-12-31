import ThemeSwitcher from "@/components/layout/ThemeSwitcher";
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
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import configuration from "@/configuration";
import { useSignOut } from "@/hooks/user.hooks";
import { cn } from "@/lib/utils";
import { LayoutData } from "@/types/layout.types";
import {
  Bell,
  ChevronsUpDown,
  CircleUser,
  CreditCard,
  LogOut,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

interface NavUserProps {
  user: LayoutData["user"];
}

export function NavUser({ user }: NavUserProps) {
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
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                open ? "px-1 py-2" : "p-0",
              )}
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg dark:bg-gray-700 dark:text-gray-100">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold dark:text-gray-100">
                  {user.name}
                </span>
                <span className="truncate text-xs dark:text-gray-400">
                  {user.email}
                </span>
              </div>
              {open && (
                <ChevronsUpDown className="ml-auto size-4 dark:text-gray-400" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-lg dark:bg-gray-900 dark:border-gray-800"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel>
              <Link
                href={configuration.paths.settings.profile}
                className="flex items-center gap-2 p-1 cursor-pointer dark:hover:bg-gray-800 rounded-md"
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg dark:bg-gray-700 dark:text-gray-100">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm">
                  <span className="font-semibold dark:text-gray-100">
                    {user.name}
                  </span>
                  <span className="text-xs dark:text-gray-400">
                    {user.email}
                  </span>
                </div>
              </Link>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="dark:border-gray-700" />
            <ThemeSwitcher />
            <DropdownMenuGroup>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem
                      className="cursor-pointer dark:hover:bg-gray-800 dark:focus:bg-gray-800"
                      asChild
                    >
                      <Link
                        href={configuration.paths.settings.profile}
                        className="dark:text-gray-100"
                      >
                        <CircleUser className="mr-2 size-4 dark:text-gray-400" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="dark:bg-gray-800 dark:text-gray-100"
                  >
                    Manage your personal profile and settings
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem
                      className="cursor-pointer dark:hover:bg-gray-800 dark:focus:bg-gray-800"
                      asChild
                    >
                      <Link
                        href={configuration.paths.settings.team}
                        className="dark:text-gray-100"
                      >
                        <UsersRound className="mr-2 size-4 dark:text-gray-400" />
                        Team
                      </Link>
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="dark:bg-gray-800 dark:text-gray-100"
                  >
                    Manage team members and permissions
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem
                      className="cursor-pointer dark:hover:bg-gray-800 dark:focus:bg-gray-800"
                      asChild
                    >
                      <Link
                        href={configuration.paths.settings.notifications}
                        className="dark:text-gray-100"
                      >
                        <Bell className="mr-2 size-4 dark:text-gray-400" />
                        Notifications
                      </Link>
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="dark:bg-gray-800 dark:text-gray-100"
                  >
                    Configure your notification preferences
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem
                      className="cursor-pointer dark:hover:bg-gray-800 dark:focus:bg-gray-800"
                      asChild
                    >
                      <Link
                        href={configuration.paths.settings.billing}
                        className="dark:text-gray-100"
                      >
                        <CreditCard className="mr-2 size-4 dark:text-gray-400" />
                        Billing
                      </Link>
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="dark:bg-gray-800 dark:text-gray-100"
                  >
                    Manage your subscription and billing details
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="dark:border-gray-700" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuItem
                    className="cursor-pointer dark:text-gray-100 dark:hover:bg-gray-800 dark:focus:bg-gray-800"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 size-4 dark:text-gray-400" />
                    Log out
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="dark:bg-gray-800 dark:text-gray-100"
                >
                  Sign out of your account
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default NavUser;
