// In components/milestones/ActivityCard.tsx - Update to use real data

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useGetMilestoneEvents } from "@/hooks/milestone.hooks";
import { cn } from "@/lib/utils";
import { useAppData } from "@/stores/app.store";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const ActivityCard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { milestone } = useAppData();

  // Fetch events for the current milestone
  const { data: events, isLoading } = useGetMilestoneEvents(milestone?.id);

  // Early return for no milestone
  if (!milestone) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            No milestone selected
          </p>
        </CardContent>
      </Card>
    );
  }

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
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 h-20 rounded-md w-full"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-20 rounded-md w-full"></div>
            </div>
          ) : events?.length ? (
            <div className="space-y-4 flex-1 overflow-hidden">
              {/* Always show the most recent activity */}
              <ActivityItem event={events[0]} />

              {/* Show the remaining activities in the collapsible section */}
              <CollapsibleContent
                className={cn(
                  "space-y-4 overflow-y-auto transition-all",
                  isOpen ? "flex-1 max-h-[calc(100vh-200px)]" : "max-h-0",
                )}
              >
                {events.slice(1).map(activity => (
                  <ActivityItem key={activity.id} event={activity} />
                ))}
              </CollapsibleContent>
            </div>
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              No activity recorded for this milestone yet
            </div>
          )}
        </CardContent>
      </Card>
    </Collapsible>
  );
};

// Component for a single activity item
const ActivityItem = ({ event }: { event: any }) => {
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

  // Dynamically import icons based on the icon_type
  const getIconComponent = (iconType: string | null) => {
    // Implementation depends on your icon library
    // This is a placeholder
    return null;
  };

  return (
    <div className={cn("p-3 rounded-lg border", getBgColor(event.actor.role))}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {event.actor.role === "system" ? (
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {getIconComponent(event.icon_type)}
            </div>
          ) : (
            <Avatar className="h-8 w-8">
              <AvatarImage src={event.actor.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {event.actor.name?.slice(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {event.actor.name || "System"}
              <span className="ml-1 text-xs text-muted-foreground">
                (
                {event.actor.role === "pm"
                  ? "Project Manager"
                  : event.actor.role === "client"
                    ? "Client"
                    : event.actor.role === "developer"
                      ? "Developer"
                      : "System"}
                )
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(event.created_at), "MMM d, h:mm a")}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {getIconComponent(event.icon_type)}
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
