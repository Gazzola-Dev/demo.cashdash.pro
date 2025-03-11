"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Edit,
  FileCheck,
} from "lucide-react";
import { useState } from "react";

// Define activity event types
type ActivityEvent = {
  id: number;
  date: Date;
  actor: {
    name: string;
    role: "pm" | "client" | "system";
    avatar?: string;
  };
  action: string;
  details?: string;
  icon?: React.ReactNode;
};

// Sample activity data
const sampleActivities: ActivityEvent[] = [
  {
    id: 1,
    date: new Date(2025, 2, 10, 9, 15),
    actor: { name: "Sarah Johnson", role: "pm", avatar: "/avatars/sarah.png" },
    action: "Created a new draft Milestone",
    icon: <Edit className="h-4 w-4 text-blue-500" />,
  },
  {
    id: 2,
    date: new Date(2025, 2, 10, 9, 30),
    actor: { name: "Sarah Johnson", role: "pm", avatar: "/avatars/sarah.png" },
    action: "Created a new draft Task",
    icon: <Edit className="h-4 w-4 text-blue-500" />,
  },
  {
    id: 3,
    date: new Date(2025, 2, 10, 10, 0),
    actor: { name: "Sarah Johnson", role: "pm", avatar: "/avatars/sarah.png" },
    action: "Changed the Milestone name",
    details: "From 'Draft Milestone' to 'Website Redesign Phase 1'",
    icon: <Edit className="h-4 w-4 text-blue-500" />,
  },
  {
    id: 4,
    date: new Date(2025, 2, 10, 10, 15),
    actor: { name: "Sarah Johnson", role: "pm", avatar: "/avatars/sarah.png" },
    action: "Changed the Milestone due date",
    details: "Set due date to April 15, 2025",
    icon: <CalendarDays className="h-4 w-4 text-blue-500" />,
  },
  {
    id: 5,
    date: new Date(2025, 2, 10, 11, 0),
    actor: { name: "Sarah Johnson", role: "pm", avatar: "/avatars/sarah.png" },
    action: "Set Milestone price",
    details: "$2,500.00",
    icon: <DollarSign className="h-4 w-4 text-green-500" />,
  },
  {
    id: 6,
    date: new Date(2025, 2, 10, 14, 30),
    actor: { name: "Sarah Johnson", role: "pm", avatar: "/avatars/sarah.png" },
    action: "Approved the Milestone",
    details: "1/2 approvals",
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  },
  {
    id: 7,
    date: new Date(2025, 2, 11, 9, 45),
    actor: {
      name: "Michael Chen",
      role: "client",
      avatar: "/avatars/michael.png",
    },
    action: "Changed the Milestone price",
    details: "From $2,500.00 to $2,750.00",
    icon: <DollarSign className="h-4 w-4 text-orange-500" />,
  },
  {
    id: 8,
    date: new Date(2025, 2, 11, 9, 46),
    actor: { name: "System", role: "system" },
    action: "Approvals reset following change in Milestone details",
    details: "0/2 approvals",
    icon: <FileCheck className="h-4 w-4 text-gray-500" />,
  },
  {
    id: 9,
    date: new Date(2025, 2, 11, 10, 30),
    actor: {
      name: "Michael Chen",
      role: "client",
      avatar: "/avatars/michael.png",
    },
    action: "Changed due date",
    details: "From April 15, 2025 to April 20, 2025",
    icon: <CalendarDays className="h-4 w-4 text-orange-500" />,
  },
  {
    id: 10,
    date: new Date(2025, 2, 11, 11, 15),
    actor: {
      name: "Michael Chen",
      role: "client",
      avatar: "/avatars/michael.png",
    },
    action: "Marked as approved",
    details: "1/2 approvals",
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  },
  {
    id: 11,
    date: new Date(2025, 2, 11, 13, 0),
    actor: { name: "Sarah Johnson", role: "pm", avatar: "/avatars/sarah.png" },
    action: "Marked as approved",
    details: "2/2 approvals",
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  },
  {
    id: 12,
    date: new Date(2025, 2, 11, 13, 1),
    actor: { name: "System", role: "system" },
    action: "Milestone is approved, awaiting payment",
    icon: <DollarSign className="h-4 w-4 text-amber-500" />,
  },
  {
    id: 13,
    date: new Date(2025, 2, 12, 9, 0),
    actor: { name: "System", role: "system" },
    action: "Milestone is active!",
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  },
  {
    id: 14,
    date: new Date(2025, 2, 15, 14, 30),
    actor: { name: "Sarah Johnson", role: "pm", avatar: "/avatars/sarah.png" },
    action: "Task 2 was marked as completed!",
    details: "1/23 tasks complete",
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  },
];

// Sort activities by date (most recent first)
const sortedActivities = [...sampleActivities].sort(
  (a, b) => b.date.getTime() - a.date.getTime(),
);

const ActivityCard = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("flex flex-col", isOpen ? "h-[calc(100vh-100px)]" : "")}
    >
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
          <CardTitle>Activity</CardTitle>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {isOpen ? (
                <div className="flex items-center">
                  <span className="mr-1">Collapse</span>
                  <ChevronUp className="h-4 w-4" />
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="mr-1">See all</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
              )}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col">
          <div className="space-y-4 flex-1 overflow-hidden">
            {/* Always show the most recent activity */}
            <ActivityItem event={sortedActivities[0]} />

            {/* Show the remaining activities in the collapsible section */}
            <CollapsibleContent
              className={cn(
                "space-y-4 overflow-y-auto transition-all",
                isOpen ? "flex-1 max-h-[calc(100vh-200px)]" : "max-h-0",
              )}
            >
              {sortedActivities.slice(1).map(activity => (
                <ActivityItem key={activity.id} event={activity} />
              ))}
            </CollapsibleContent>
          </div>
        </CardContent>
      </Card>
    </Collapsible>
  );
};

// Component for a single activity item
const ActivityItem = ({ event }: { event: ActivityEvent }) => {
  // Different styles based on actor role
  const getBgColor = (role: string) => {
    switch (role) {
      case "pm":
        return "bg-blue-50 dark:bg-blue-950/30";
      case "client":
        return "bg-amber-50 dark:bg-amber-950/30";
      case "system":
        return "bg-gray-50 dark:bg-gray-900/50";
      default:
        return "bg-gray-50 dark:bg-gray-900/50";
    }
  };

  return (
    <div className={cn("p-3 rounded-lg border", getBgColor(event.actor.role))}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {event.actor.role === "system" ? (
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <FileCheck className="h-4 w-4 text-gray-500" />
            </div>
          ) : (
            <Avatar className="h-8 w-8">
              <AvatarImage src={event.actor.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {event.actor.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {event.actor.name}
              <span className="ml-1 text-xs text-muted-foreground">
                (
                {event.actor.role === "pm"
                  ? "Project Manager"
                  : event.actor.role === "client"
                    ? "Client"
                    : "System"}
                )
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {format(event.date, "MMM d, h:mm a")}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {event.icon}
            <p className="text-sm">
              {event.action}
              {event.details && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({event.details})
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;
