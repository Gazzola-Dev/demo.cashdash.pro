import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app.store";
import { Book, BookOpenText } from "lucide-react";

export const ProjectSwitcherSkeleton = () => {
  const { open } = useSidebar();
  const { user } = useAppStore();

  return (
    <SidebarMenu>
      <SidebarMenuItem
        className={cn(
          "flex items-center",
          open ? "justify-between" : "flex-col gap-2",
        )}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" className={cn(open ? "" : "w-full")}>
                {open ? (
                  <BookOpenText className="size-5" />
                ) : (
                  <Book className="size-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {open ? "Collapse sidebar" : "Expand sidebar"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          variant="ghost"
          className={cn(
            "flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 relative",
            open
              ? "px-2 h-auto w-full space-x-1"
              : "p-2 h-auto w-10 aspect-square",
          )}
        >
          <div
            className={cn(
              "flex aspect-square items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700",
              open ? "size-8" : "size-6",
              user ? "animate-pulse" : "opacity-0",
            )}
          ></div>

          {open && (
            <div className="grid flex-1 text-left text-sm leading-tight ml-2">
              <div
                className={cn(
                  "h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded",
                  user ? "animate-pulse" : "opacity-0",
                )}
              ></div>
            </div>
          )}
        </Button>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default ProjectSwitcherSkeleton;
