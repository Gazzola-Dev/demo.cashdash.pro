import { StatusIconSimple } from "@/components/tasks/SimpleTaskSelectComponents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import configuration from "@/configuration";
import useDemoData from "@/hooks/useDemoData";
import { capitalizeFirstLetter } from "@/lib/string.util";
import { cn } from "@/lib/utils";
import { CalendarDays, CircleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const TaskList = () => {
  const { project } = useDemoData();
  const [sortByPriority, setSortByPriority] = useState(true);
  const [sortById, setSortById] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Get all tasks from the project
  const tasks = project?.tasks || [];
  const members = project?.project_members || [];

  // Filter tasks by selected member
  const filteredTasks = tasks.filter(taskResult => {
    if (["completed", "draft", "backlog"].includes(taskResult.task.status))
      return false;
    if (!selectedMemberId) return true;
    if (taskResult.task.assignee === selectedMemberId)
      console.log(taskResult.task.assignee, selectedMemberId);
    return taskResult.task.assignee === selectedMemberId;
  });

  // Sort tasks based on active sorting button
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortByPriority) {
      return a.task.ordinal_priority - b.task.ordinal_priority;
    }
    if (sortById) {
      return a.task.ordinal_id - b.task.ordinal_id;
    }
    return 0;
  });

  const handlePrioritySort = () => {
    setSortByPriority(true);
    setSortById(false);
  };

  const handleIdSort = () => {
    setSortById(true);
    setSortByPriority(false);
  };

  const handleMemberCycle = () => {
    const memberIds = [null, ...members.map(m => m.user_id)];
    const currentIndex = memberIds.indexOf(selectedMemberId);
    const nextIndex = (currentIndex + 1) % memberIds.length;
    setSelectedMemberId(memberIds[nextIndex]);
  };

  const getSelectedMemberName = (initialsOnly = true) => {
    if (!selectedMemberId) return "∞";
    const member = members.find(m => m.user_id === selectedMemberId);
    const name = member?.profile?.display_name
      ? capitalizeFirstLetter(member.profile.display_name)
      : "??";
    return initialsOnly ? name.slice(0, 2) : name;
  };

  return (
    <div className="px-3 space-y-2 pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-gray-800 dark:text-gray-200 font-medium">
          Tasks ({sortedTasks.length})
        </h3>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={handlePrioritySort}
                  className={cn(
                    "w-1 h-8",
                    sortByPriority && " dark:bg-gray-800 bg-gray-100",
                  )}
                >
                  <CircleAlert className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Highest priority first {sortByPriority ? "(active)" : ""}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={handleIdSort}
                  className={cn(
                    "w-10 h-8",
                    sortById && " dark:bg-gray-800 bg-gray-100",
                  )}
                >
                  <CalendarDays className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Newest first {sortById ? "(active)" : ""}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={handleMemberCycle}
                  className={cn("w-10 h-8")}
                >
                  <Avatar className="h-7 w-7 cursor-pointer">
                    <AvatarFallback className="text-lg bg-gray-200 dark:bg-gray-700 dark:text-gray-100">
                      <span
                        className={cn(
                          "mb-[3px]",
                          selectedMemberId && "mb-0 text-sm",
                        )}
                      >
                        {getSelectedMemberName()}
                      </span>
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {selectedMemberId == null
                  ? "All members"
                  : `${getSelectedMemberName(false)}'s tasks`}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <hr className="w-full dark:border-blue-900" />

      <div className="flex-1 overflow-y-auto">
        <TooltipProvider>
          {sortedTasks.map(taskResult => {
            const task = taskResult.task;

            const assigneeProfile = taskResult.assignee_profile;
            const taskPath = configuration.paths.tasks.view({
              project_slug: project?.slug,
              task_slug: task.slug,
            });

            return (
              <Link
                key={task.id}
                href={taskPath}
                className="flex items-center gap-2 px-1 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 select-none text-sm"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-gray-900 dark:text-gray-100 w-2.5 rounded">
                      {task.ordinal_priority}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {task.ordinal_priority}
                    {task.ordinal_priority === 1
                      ? "st"
                      : task.ordinal_priority === 2
                        ? "nd"
                        : task.ordinal_priority === 3
                          ? "rd"
                          : "th"}{" "}
                    priority
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <StatusIconSimple status={task.status} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {capitalizeFirstLetter(task.status.replace("_", " "))}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="border border-gray-500 px-1.5  rounded">
                      {task.ordinal_id}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{task.slug.toUpperCase()}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex-1 truncate">{task.title}</span>
                  </TooltipTrigger>
                  <TooltipContent side="right">{task.title}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={assigneeProfile?.avatar_url || undefined}
                      />
                      <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-700 dark:text-gray-100 text-black">
                        {assigneeProfile
                          ? capitalizeFirstLetter(
                              assigneeProfile.display_name?.slice(0, 2) || "??",
                            )
                          : "NA"}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Assigned to: {assigneeProfile?.display_name || "Unassigned"}
                  </TooltipContent>
                </Tooltip>
              </Link>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
};

export default TaskList;
