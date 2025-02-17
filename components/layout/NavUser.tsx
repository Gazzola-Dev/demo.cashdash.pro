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
import useAppStore from "@/hooks/app.store";
import { capitalizeFirstLetter } from "@/lib/string.util";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import Link from "next/link";
import ThemeSwitcher from "./ThemeSwitcher";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { open } = useSidebar();
  const { profile: profileData } = useAppStore();

  const handleSignOut = () => {};

  if (!profileData) return null;

  const avatarContent = (
    <>
      <Avatar className="size-8 rounded-lg">
        <AvatarImage
          src={profileData.profile.avatar_url ?? ""}
          alt={profileData.profile.display_name ?? "User"}
        />
        <AvatarFallback className="rounded-lg bg-gray-200 dark:bg-gray-700 dark:text-gray-100">
          {capitalizeFirstLetter(
            profileData.profile.display_name?.slice(0, 2) ??
              profileData.profile.email.slice(0, 2) ??
              "?",
          )}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold dark:text-gray-100">
          {capitalizeFirstLetter(
            profileData.profile.display_name ||
              profileData.profile.email.split("@")?.[0] ||
              "Unnamed User",
          )}
        </span>
      </div>
    </>
  );

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
              {avatarContent}
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
                      href={configuration.paths.appHome}
                      className="flex items-center gap-2 p-1 cursor-pointer dark:hover:bg-gray-800 rounded-md space-x-1.5"
                    >
                      {avatarContent}
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
                      className="cursor-pointer dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100 px-3"
                      onClick={handleSignOut}
                    >
                      <div className="flex items-center gap-4">
                        <LogOut className="size-4" />
                        <span className="text-sm"> Sign out</span>
                      </div>
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="dark:bg-gray-800 dark:text-gray-100"
                  >
                    Sign out of your account
                  </TooltipContent>
                </Tooltip>
              </DropdownMenuGroup>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full">
                    <ThemeSwitcher />
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="dark:bg-gray-800 dark:text-gray-100"
                >
                  Change theme (Dark mode is still in beta!)
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
