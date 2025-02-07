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
import { useGetProfile } from "@/hooks/profile.hooks";
import { useSignOut } from "@/hooks/user.hooks";
import { cn } from "@/lib/utils";
import { Bell, CreditCard, Settings2 } from "lucide-react";
import Link from "next/link";
import ThemeSwitcher from "./ThemeSwitcher";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { mutate: signOut } = useSignOut();
  const { open } = useSidebar();
  const { data: profileData } = useGetProfile();

  const handleSignOut = () => {
    signOut();
  };

  if (!profileData) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-auto flex items-center justify-between w-full",
                "hover:bg-gray-100 dark:hover:bg-gray-800 space-x-1.5",
                open ? "px-1 py-2" : "p-0",
              )}
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage
                  src={profileData.profile.avatar_url ?? ""}
                  alt={profileData.profile.display_name ?? "User"}
                />
                <AvatarFallback className="rounded-lg dark:bg-gray-700 dark:text-gray-100">
                  {profileData.profile.display_name?.charAt(0) ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold dark:text-gray-100">
                  {profileData.profile.display_name ?? "Unnamed User"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-lg dark:bg-gray-900 dark:border-gray-800 select-none"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuLabel>
                    <Link
                      href={configuration.paths.settings.profile}
                      className="flex items-center gap-2 p-1 cursor-pointer dark:hover:bg-gray-800 rounded-md space-x-1.5"
                    >
                      <Avatar className="size-8 rounded-lg">
                        <AvatarImage
                          src={profileData.profile.avatar_url ?? ""}
                          alt={profileData.profile.display_name ?? "User"}
                        />
                        <AvatarFallback className="rounded-lg dark:bg-gray-700 dark:text-gray-100">
                          {profileData.profile.display_name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm">
                        <span className="font-semibold dark:text-gray-100">
                          {profileData.profile.display_name ?? "Unnamed User"}
                        </span>
                      </div>
                    </Link>
                  </DropdownMenuLabel>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="dark:bg-gray-800 dark:text-gray-100"
                >
                  Manage your personal profile and settings
                </TooltipContent>
              </Tooltip>
              <DropdownMenuSeparator className="dark:border-gray-700" />
              <DropdownMenuGroup>
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

                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem
                      className="cursor-pointer dark:hover:bg-gray-800 dark:focus:bg-gray-800"
                      asChild
                    >
                      <Link
                        href={configuration.paths.settings.all}
                        className="dark:text-gray-100"
                      >
                        <Settings2 className="mr-2 size-4 dark:text-gray-400" />
                        All Settings
                      </Link>
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="dark:bg-gray-800 dark:text-gray-100"
                  >
                    Manage all settings
                  </TooltipContent>
                </Tooltip>
              </DropdownMenuGroup>
            </TooltipProvider>
            <ThemeSwitcher />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default NavUser;
