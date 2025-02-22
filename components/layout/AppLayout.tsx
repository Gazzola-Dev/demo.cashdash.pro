"use client";
import LogoText from "@/components/SVG/LogoText";
import ProfileFormSmall from "@/components/layout/ProfileFormSmall";
import { ProjectSwitcher } from "@/components/layout/ProjectSwitcher";
import RouteBreadcrumb from "@/components/layout/RouteBreadCrumb";
import { SidebarButton } from "@/components/layout/SidebarComponents";
import TaskList from "@/components/layout/TaskList";
import ThemeSwitcher from "@/components/layout/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import configuration from "@/configuration";
import useAppData from "@/hooks/useAppData";
import { useDialogQueue } from "@/hooks/useDialogQueue";
import { Dot, Gauge, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

function AppSidebar() {
  const { open } = useSidebar();
  const { project } = useAppData();
  const router = useRouter();
  const { dialog } = useDialogQueue();

  const handleSignOut = () => {
    dialog({
      title: "Sign Out",
      description: "Are you sure you want to sign out?",
      confirmText: "Sign Out",
      cancelText: "Cancel",
      onConfirm: async () => {
        router.refresh();
      },
    });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="border-r dark:border-blue-900">
        <SidebarHeader>
          <ProjectSwitcher />
        </SidebarHeader>
        <SidebarGroup>
          <SidebarMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <SidebarMenuItem>
                    <SidebarButton
                      href={configuration.paths.appHome}
                      matchPattern={configuration.paths.appHome + "$"}
                    >
                      <Gauge className="size-5" />
                      <span>Dashboard</span>
                    </SidebarButton>
                  </SidebarMenuItem>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {open ? "Project roadmap" : "Calendar"}
                </TooltipContent>
              </Tooltip>
              {/* <Tooltip>
                <TooltipTrigger>
                  <SidebarMenuItem>
                    <SidebarButton
                      href={configuration.paths.project.workflow({
                        project_slug: project?.slug,
                      })}
                      matchPattern={configuration.paths.project.workflow({
                        project_slug: project?.slug,
                      })}
                    >
                      <PanelsRightBottom className="size-5" />
                      <span>Workflow</span>
                    </SidebarButton>
                  </SidebarMenuItem>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {open ? "Project roadmap" : "Calendar"}
                </TooltipContent>
              </Tooltip> */}
              <Tooltip>
                <TooltipTrigger>
                  <SidebarMenuItem>
                    <SidebarButton
                      href={configuration.paths.project.view({
                        project_slug: project?.slug,
                      })}
                      matchPattern={
                        configuration.paths.project.view({
                          project_slug: project?.slug,
                        }) + "$"
                      }
                    >
                      <Settings className="size-5" />
                      <span>Project</span>
                    </SidebarButton>
                  </SidebarMenuItem>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {open ? "Project roadmap" : "Calendar"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </SidebarMenu>
        </SidebarGroup>
        <div className="flex-grow overflow-auto">
          {/* <NotificationList /> */}
          <TaskList />
        </div>

        <SidebarFooter className="gap-0.5">
          {/* <Tooltip>
            <TooltipTrigger>
              <SidebarMenuItem className="flex items-center gap-2.5 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 select-none text-sm">
                <CreditCard className="size-4" />
                <span className="py-1">Billing</span>
              </SidebarMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right">
              Manage your billing details
            </TooltipContent>
          </Tooltip> */}
          <Tooltip>
            <TooltipTrigger>
              <SidebarMenuItem
                className="flex items-center gap-2.5 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 select-none text-sm"
                onClick={handleSignOut}
              >
                <LogOut className="size-4" />
                <span className="py-1">Sign out</span>
              </SidebarMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right">
              Sign out of your account
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <div className="w-full">
                <ThemeSwitcher />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Change theme</TooltipContent>
          </Tooltip>
          <ProfileFormSmall />
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}

function DeleteAccountDialog({
  open,
  onOpenChange,
  email,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
}) {
  const [confirmText, setConfirmText] = useState("");
  const { profile } = useAppData();
  const expectedText = `delete ${profile?.display_name}`;
  const isValid = confirmText === expectedText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription className="space-y-4">
            <p>
              Are you sure you want to permanently delete your account and all
              related data? This cannot be undone.
            </p>
            <p>Type &quot;delete {profile?.display_name}&quot; to confirm</p>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder={`delete ${profile?.display_name}`}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!isValid}
            onClick={() => onOpenChange(false)}
          >
            Delete Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = useAppData();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center justify-between gap-2">
            <RouteBreadcrumb />
            <Link
              href={configuration.paths.about}
              className="flex items-center justify-center gap-2 h-full pr-[1.1rem]"
            >
              <LogoText className="fill-blue-700 dark:fill-blue-400 w-24 z-10 -mr-1 pt-0.5" />
            </Link>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 justify-between w-full pb-1">
            <main className="flex flex-col items-center overflow-auto">
              {children}
            </main>
            <footer className="flex items-center justify-end w-full text-xs text-gray-500 gap-2">
              <div className="flex items-center gap-2">
                {/* <button
                  className="dark:hover:text-gray-200 hover:text-gray-800"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete my account
                </button> */}
                {/* <Dot className="size-3" /> */}
                <Link
                  className="dark:hover:text-gray-200 hover:text-gray-800"
                  href={configuration.paths.privacy}
                >
                  Privacy
                </Link>
                <Dot className="size-3" />
                <Link
                  className="dark:hover:text-gray-200 hover:text-gray-800"
                  href={configuration.paths.terms}
                >
                  Terms
                </Link>
                <Dot className="size-3" />
                <p className="select-none cursor-default">
                  &copy; {new Date().getFullYear()} Apex Apps
                </p>
              </div>
            </footer>
          </div>
        </SidebarInset>
      </div>
      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        email={profile?.email || ""}
      />
    </SidebarProvider>
  );
}

export default AppLayout;
