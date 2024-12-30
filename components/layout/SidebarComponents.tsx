// components/layout/SidebarButton.tsx
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
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
import { cn } from "@/lib/utils";
import { LayoutDashboard, LifeBuoy, Send, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface SidebarButtonProps {
  href: string;
  children: ReactNode;
  isActive?: boolean;
  matchPattern?: string;
}

export function SidebarButton({
  href,
  children,
  isActive: forcedActive,
  matchPattern,
}: SidebarButtonProps) {
  const pathname = usePathname();

  // Determine active state based on matchPattern, forcedActive, or exact match
  const isActive =
    forcedActive ??
    (matchPattern
      ? new RegExp(matchPattern).test(pathname)
      : pathname === href);

  return (
    <SidebarMenuButton
      asChild
      size="sm"
      className={cn(
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
        "relative",
        isActive &&
          "after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-8 after:w-[2px] after:bg-primary after:rounded-l",
      )}
    >
      <Link href={href}>{children}</Link>
    </SidebarMenuButton>
  );
}

// components/layout/OverviewButton.tsx
export function OverviewButton({ projectSlug }: { projectSlug: string }) {
  const pathname = usePathname();
  const isActive = pathname === `/${projectSlug}`;

  return (
    <SidebarButton href={`/${projectSlug}`} isActive={isActive}>
      <LayoutDashboard className="size-4" />
      <span>Overview</span>
    </SidebarButton>
  );
}

// components/layout/NavSecondary.tsx
export function NavSecondary() {
  const { open } = useSidebar();
  const pathname = usePathname();

  return (
    <SidebarGroup className="mt-auto relative">
      <SidebarGroupContent>
        <SidebarMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <SidebarMenuItem>
                  <SidebarButton
                    href={configuration.paths.settings.all}
                    isActive={pathname.startsWith(
                      configuration.paths.settings.all,
                    )}
                  >
                    <Settings2 className="size-4" />
                    <span>Settings</span>
                  </SidebarButton>
                </SidebarMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right">
                {open ? "Configure your account and preferences" : "Settings"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <SidebarMenuItem>
                  <SidebarButton
                    href={configuration.paths.feedback}
                    isActive={pathname === configuration.paths.feedback}
                  >
                    <Send className="size-4" />
                    <span>Feedback</span>
                  </SidebarButton>
                </SidebarMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right">
                {open ? "Share your feedback with us" : "Feedback"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <SidebarMenuItem>
                  <SidebarButton
                    href={configuration.paths.support}
                    isActive={pathname === configuration.paths.support}
                  >
                    <LifeBuoy className="size-4" />
                    <span>Support</span>
                  </SidebarButton>
                </SidebarMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right">
                {open ? "Get help and support" : "Support"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
