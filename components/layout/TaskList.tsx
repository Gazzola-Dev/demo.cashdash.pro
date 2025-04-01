import { StatusIconSimple } from "@/components/tasks/SimpleTaskSelectComponents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import configuration from "@/configuration";
import { DemoElementId } from "@/lib/demo-data";
import { capitalizeFirstLetter } from "@/lib/string.util";
import { cn } from "@/lib/utils";
import { useAppData } from "@/stores/app.store";
import { Tables } from "@/types/database.types";
import { Award, CalendarDays, ListFilter } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type TaskStatus = Tables<"tasks">["status"];

const statusOrder: TaskStatus[] = [
  // "backlog",
  "todo",
  "in_progress",
  "in_review",
  // "completed",
  // "draft",
];

const TaskSkeleton = ({ open }: { open: boolean }) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 py-1.5 select-none text-sm bg-white dark:bg-gray-900 animate-pulse",
        open ? "pl-4 pr-3 rounded-l-lg rounded-r-full" : "rounded-br-lg",
      )}
    >
      {/* Priority number */}
      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>

      {open && (
        <>
          {/* Status icon */}
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>

          {/* Task ID */}
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>

          {/* Task title */}
          <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>

          {/* Avatar */}
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </>
      )}
    </div>
  );
};

const TaskList = () => {
  const { open } = useSidebar();
  const { tasks, project, task: appTask } = useAppData();
  const [sortByPriority, setSortByPriority] = useState(true);
  const [sortById, setSortById] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);

  // Get all tasks from the project
  const members = project?.project_members || [];

  // Filter tasks by selected member and status
  const filteredTasks = tasks.filter(task => {
    if (["completed", "draft", "backlog"].includes(task.status ?? ""))
      return false;
    if (selectedMemberId && task.assignee !== selectedMemberId) return false;
    if (selectedStatus && task.status !== selectedStatus) return false;
    return true;
  });

  // Sort tasks based on active sorting button
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortByPriority) {
      return (a?.ordinal_priority ?? 0) - (b?.ordinal_priority ?? 0);
    }
    if (sortById) {
      return (a?.ordinal_id ?? 0) - (b?.ordinal_id ?? 0);
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

  const handleStatusCycle = () => {
    const currentIndex = selectedStatus
      ? statusOrder.indexOf(selectedStatus)
      : -1;
    const nextIndex = (currentIndex + 1) % (statusOrder.length + 1);
    setSelectedStatus(
      nextIndex === statusOrder.length ? null : statusOrder[nextIndex],
    );
  };

  const handleMemberCycle = () => {
    const memberIds = [null, ...members.map(m => m.user_id)];
    const currentIndex = memberIds.indexOf(selectedMemberId);
    const nextIndex = (currentIndex + 1) % memberIds.length;
    setSelectedMemberId(memberIds[nextIndex] ?? "");
  };

  const getSelectedMemberName = (initialsOnly = true) => {
    if (!selectedMemberId) return "∞";
    const member = members.find(m => m.user_id === selectedMemberId);
    const name = member?.profile?.display_name
      ? capitalizeFirstLetter(member.profile.display_name)
      : "??";
    return initialsOnly ? name.slice(0, 2) : name;
  };

  if (!tasks.length) return <div className="flex-grow"></div>;
  return (
    <>
      {open && (
        <>
          <div className="w-full pl-[5rem] pr-6">
            <hr className="w-full dark:border-blue-900" />
          </div>
          <div className="flex items-center justify-between px-3 pr-[1.15rem]">
            <h3 className="text-sm text-gray-800 dark:text-gray-200 font-medium">
              Tasks
            </h3>
            <div
              className="flex items-center gap-1"
              id={DemoElementId.TASK_LIST_HEADER_BUTTONS}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={handlePrioritySort}
                      className={cn(
                        "w-8 h-7 border border-transparent",
                        sortByPriority &&
                          "dark:bg-gray-800 bg-gray-100 border dark:border-gray-700 border-gray-300",
                      )}
                    >
                      <Award className="size-4" />
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
                      onClick={handleStatusCycle}
                      className={cn(
                        "w-8 h-7 border border-transparent",
                        selectedStatus &&
                          "dark:bg-gray-800 bg-gray-100 border dark:border-gray-700 border-gray-300",
                      )}
                    >
                      {selectedStatus ? (
                        <StatusIconSimple status={selectedStatus} />
                      ) : (
                        <ListFilter className="size-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {selectedStatus
                      ? `Showing "${capitalizeFirstLetter(selectedStatus.replace("_", " "))}" tasks`
                      : "No filter applied"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={handleIdSort}
                      className={cn(
                        "w-8 h-7 border border-transparent",
                        sortById &&
                          "dark:bg-gray-800 bg-gray-100 border dark:border-gray-700 border-gray-300",
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
                              selectedMemberId
                                ? "text-sm mb-px"
                                : "mb-[3px] text-lg font-light dark:text-gray-200 text-gray-600",
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
          <div className="w-full pl-2.5 pb-2 pr-6">
            <hr className="w-full dark:border-blue-900" />
          </div>
        </>
      )}
      <div
        className="space-y-2 flex-grow overflow-auto"
        id={DemoElementId.TASK_LIST_ITEMS}
      >
        <div className="flex-1 overflow-y-auto pr-2">
          {
            <TooltipProvider>
              {sortedTasks.map(task => {
                const assigneeProfile = task.assignee_profile;
                const taskPath = configuration.paths.tasks.view({
                  project_slug: project?.slug,
                  ordinal_id: task.ordinal_id,
                });

                return (
                  <Link
                    key={task.id}
                    href={taskPath}
                    className={cn(
                      "flex items-center gap-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 select-none text-sm bg-white dark:bg-gray-900 bl-none justify-center",
                      open
                        ? "pl-4 pr-3 rounded-l-lg rounded-r-full"
                        : "rounded-br-lg",
                      appTask?.id === task.id &&
                        !open &&
                        "border-b-2 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/50 my-1",
                      appTask?.id === task.id &&
                        open &&
                        "border-r-2 border-b border-blue-500 dark:border-blue-400 p-1.5 bg-blue-50 dark:bg-blue-950/50 my-2 pl-4 ",
                    )}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            open ? "w-6 flex items-end gap-0.5" : "",
                          )}
                        >
                          <span className="text-sm text-black font-medium dark:text-gray-100 rounded">
                            {task.ordinal_priority || 1}
                          </span>

                          <span className="text-xs text-gray-600 dark:text-gray-300 lowercase mb-px">
                            {!task.ordinal_priority ||
                            task.ordinal_priority === 1
                              ? "st"
                              : task.ordinal_priority === 2
                                ? "nd"
                                : task.ordinal_priority === 3
                                  ? "rd"
                                  : "th"}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {task.ordinal_priority}
                        {task.ordinal_priority === 1
                          ? "st"
                          : task.ordinal_priority === 2
                            ? "nd"
                            : task.ordinal_priority === 3
                              ? "rd"
                              : "th"}
                        priority
                      </TooltipContent>
                    </Tooltip>
                    {open && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className="px-1"
                              id={
                                task.id === appTask?.id
                                  ? "task-status-icon"
                                  : undefined
                              }
                            >
                              <StatusIconSimple status={task.status ?? ""} />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {capitalizeFirstLetter(
                              task.status?.replace("_", " ") ?? "",
                            )}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className={cn(
                                task.id === appTask?.id
                                  ? "border-blue-500 dark:border-blue-400"
                                  : "border-gray-700 dark:border-gray-400",
                                "border-b px-1.5 pt-0 rounded-bl",
                              )}
                            >
                              {task.ordinal_id}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {task.slug?.toUpperCase()}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex-1 truncate pl-1">
                              {task.title}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {task.title}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Avatar
                              className={cn(
                                appTask?.id === task.id ? "size-10" : "h-6 w-6",
                              )}
                            >
                              <AvatarImage
                                src={assigneeProfile?.avatar_url || undefined}
                              />
                              <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-700 dark:text-gray-100 text-black">
                                {assigneeProfile
                                  ? capitalizeFirstLetter(
                                      assigneeProfile.display_name?.slice(
                                        0,
                                        2,
                                      ) || "??",
                                    )
                                  : "NA"}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            Assigned to:{" "}
                            {assigneeProfile?.display_name || "Unassigned"}
                          </TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </Link>
                );
              })}
            </TooltipProvider>
          }
        </div>
      </div>
    </>
  );
};

export default TaskList;
