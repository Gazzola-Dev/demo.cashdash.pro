import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  FolderGit2,
  MessagesSquare,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Siren,
  Trophy,
} from "lucide-react";
import { useState } from "react";

type NotificationVariant =
  | "Comment"
  | "Task"
  | "Project"
  | "Message"
  | "Milestone";
type NotificationPriority = "urgent" | "high" | "medium" | "low";

interface Notification {
  id: string;
  variant: NotificationVariant;
  priority: NotificationPriority | null;
  message: string;
  createdAt: number;
}

const variantConfig = {
  Comment: {
    icon: MessagesSquare,
    color: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-50 dark:bg-purple-900/10",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  Task: {
    icon: CheckSquare,
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-900/10",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  Project: {
    icon: FolderGit2,
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-50 dark:bg-green-900/10",
    borderColor: "border-green-200 dark:border-green-800",
  },
  Message: {
    icon: MessagesSquare,
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-50 dark:bg-amber-900/10",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  Milestone: {
    icon: Trophy,
    color: "text-rose-700 dark:text-rose-300",
    bgColor: "bg-rose-50 dark:bg-rose-900/10",
    borderColor: "border-rose-200 dark:border-rose-800",
  },
};

const getPriorityIcon = (priority: NotificationPriority) => {
  switch (priority) {
    case "urgent":
      return Signal;
    case "high":
      return SignalHigh;
    case "medium":
      return SignalMedium;
    case "low":
      return SignalLow;
  }
};

const getAgeIcon = (createdAt: number) => {
  const hoursSince = (Date.now() / 1000 - createdAt) / 3600;

  if (hoursSince < 6)
    return { icon: SignalLow, tooltip: "Less than 12 hours ago" };
  if (hoursSince < 12)
    return { icon: SignalMedium, tooltip: "Less than 12 hours ago" };
  if (hoursSince < 24)
    return { icon: SignalHigh, tooltip: "Less than 24 hours ago" };
  if (hoursSince < 48)
    return { icon: Signal, tooltip: "Less than 48 hours ago" };

  return { icon: Siren, tooltip: "More than 48 hours ago" };
};

const mockNotifications: Notification[] = [
  {
    id: "1",
    variant: "Comment",
    // priority: "high",
    priority: null,
    message: "GO-124: Aaron: Thanks for the update!",
    createdAt: Date.now() / 1000 - 3600, // 1 hour ago
  },
  {
    id: "2",
    variant: "Task",
    // priority: "urgent",
    priority: null,
    message: "Task ECO-456 requires immediate attention",
    createdAt: Date.now() / 1000 - 50400, // 14 hours ago
  },
  {
    id: "5",
    variant: "Milestone",
    // priority: "high",
    priority: null,
    message: "Project milestone achieved: Phase 1 Complete",
    createdAt: Date.now() / 1000 - 93600, // 26 hours ago
  },
  {
    id: "3",
    variant: "Comment",
    // priority: "high",
    priority: null,
    message: "GO-123: John: Can you please review the latest changes?",
    createdAt: Date.now() / 1000 - 176400, // 49 hours ago
  },
];

const NotificationList = () => {
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);

  const handleNotificationClick = (id: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id),
    );
  };

  return (
    <div className="px-4 space-y-2">
      <h3
        className={cn("text-sm text-gray-800 dark:text-gray-200 font-medium")}
      >
        Notifications ({notifications.length})
      </h3>
      <hr className={cn("w-full dark:border-blue-900")} />

      {notifications
        .sort((a, b) => a.createdAt - b.createdAt)
        .map(notification => {
          const config = variantConfig[notification.variant];
          const VariantIcon = config.icon;
          const PriorityIcon = notification.priority
            ? getPriorityIcon(notification.priority)
            : null;
          const { icon: AgeIcon, tooltip: ageTooltip } = getAgeIcon(
            notification.createdAt,
          );

          return (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification.id)}
              className={cn(
                "flex items-center gap-3 px-1.5 py-1 rounded-md cursor-pointer",
                "transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800",
                //   config.bgColor,
                //   config.borderColor,
              )}
            >
              <TooltipProvider>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Tooltip>
                    <TooltipTrigger>
                      <AgeIcon className={cn("h-4 w-4")} />
                    </TooltipTrigger>
                    <TooltipContent>{ageTooltip}</TooltipContent>
                  </Tooltip>
                  <span className="truncate flex-1 text-sm">
                    {notification.message}
                  </span>
                </div>
              </TooltipProvider>
            </div>
          );
        })}
    </div>
  );
};
export default NotificationList;
