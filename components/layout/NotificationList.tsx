import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useDemoData from "@/hooks/useDemoData";
import { cn } from "@/lib/utils";
import {
  BellMinus,
  CheckCircle2,
  FolderGit2,
  GitPullRequest,
  MessagesSquare,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Siren,
  Trophy,
} from "lucide-react";
import { useState } from "react";

const getAgeIcon = (createdAt: string) => {
  const hoursSince =
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 3600);

  if (hoursSince < 6)
    return { icon: SignalLow, tooltip: "Less than 6 hours ago" };
  if (hoursSince < 12)
    return { icon: SignalMedium, tooltip: "Less than 12 hours ago" };
  if (hoursSince < 24)
    return { icon: SignalHigh, tooltip: "Less than 24 hours ago" };
  if (hoursSince < 48)
    return { icon: Signal, tooltip: "Less than 48 hours ago" };

  return { icon: Siren, tooltip: "More than 48 hours ago" };
};

const getVariantConfig = (contentType: string) => {
  const configs = {
    comment: {
      icon: MessagesSquare,
      color: "text-purple-700 dark:text-purple-300",
      bgColor: "bg-purple-50 dark:bg-purple-900/10",
      borderColor: "border-purple-200 dark:border-purple-800",
    },
    task: {
      icon: CheckCircle2,
      color: "text-blue-700 dark:text-blue-300",
      bgColor: "bg-blue-50 dark:bg-blue-900/10",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    project: {
      icon: FolderGit2,
      color: "text-green-700 dark:text-green-300",
      bgColor: "bg-green-50 dark:bg-green-900/10",
      borderColor: "border-green-200 dark:border-green-800",
    },
    milestone: {
      icon: Trophy,
      color: "text-rose-700 dark:text-rose-300",
      bgColor: "bg-rose-50 dark:bg-rose-900/10",
      borderColor: "border-rose-200 dark:border-rose-800",
    },
    pull_request: {
      icon: GitPullRequest,
      color: "text-amber-700 dark:text-amber-300",
      bgColor: "bg-amber-50 dark:bg-amber-900/10",
      borderColor: "border-amber-200 dark:border-amber-800",
    },
  };

  return configs[contentType as keyof typeof configs] || configs.task;
};

const NotificationList = () => {
  const { notifications } = useDemoData();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const handleNotificationClick = (id: string) => {
    setDismissed([...dismissed, id]);
  };

  const handleClearAll = () => {
    setDismissed(notifications.map(n => n.id));
  };

  const activeNotifications = notifications
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .filter(n => !dismissed.includes(n.id));

  if (!activeNotifications.length) return null;

  return (
    <div className="px-3 space-y-2 pt-1 pb-2.5">
      <div className="flex items-center justify-between">
        <h3
          className={cn("text-sm text-gray-800 dark:text-gray-200 font-medium")}
        >
          Notifications ({activeNotifications.length})
        </h3>
        {activeNotifications.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleClearAll}
                >
                  <BellMinus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear all notifications</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <hr className={cn("w-full dark:border-blue-900")} />

      {activeNotifications.map(notification => {
        const config = getVariantConfig(notification.content_type);
        const { icon: AgeIcon, tooltip: ageTooltip } = getAgeIcon(
          notification.created_at,
        );

        return (
          <div
            key={notification.id}
            onClick={() => handleNotificationClick(notification.id)}
            className={cn(
              "flex items-center gap-3 px-1 py-1 rounded-md cursor-pointer",
              "transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800",
            )}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AgeIcon className="size-4 pb-px" />
                </TooltipTrigger>
                <TooltipContent>{ageTooltip}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="truncate flex-1 text-sm">
                      {notification.message}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {notification.message}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationList;
