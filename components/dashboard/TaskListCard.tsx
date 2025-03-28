import { StatusIconSimple } from "@/components/tasks/SimpleTaskSelectComponents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import configuration from "@/configuration";
import useProjectRole from "@/hooks/member.hooks";
import { useTaskListCard } from "@/hooks/useTaskListCard";
import { capitalizeFirstLetter } from "@/lib/string.util";
import { cn } from "@/lib/utils";
import { useAppData } from "@/stores/app.store";
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  Droppable,
  DroppableProvided,
} from "@hello-pangea/dnd";
import { Check, ChevronDown, ChevronUp, Menu, Search } from "lucide-react";
import Link from "next/link";

// Loading Skeleton Component
const TaskListCardSkeleton = () => {
  return (
    <Card className="h-full max-h-[calc(100vh-100px)] md:max-h-[40rem]">
      <CardHeader className="pb-3">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </CardTitle>
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="w-24 h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="w-[150px] h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-3 flex flex-col overflow-hidden">
        <div className="border rounded-md flex flex-col overflow-hidden h-full">
          {/* Fixed header row that doesn't scroll */}
          <div className="grid grid-cols-[30px_60px_50px_120px_1fr_120px] bg-muted px-2 py-2 text-xs font-medium">
            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>

          {/* Scrollable content */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight: "calc(100% - 32px)" }}
          >
            <div className="divide-y">
              {/* Render 5 skeleton rows */}
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[30px_60px_50px_120px_1fr_120px] items-center px-2 py-2"
                >
                  <div className="flex justify-center">
                    <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div className="text-center">
                    <div className="h-5 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto"></div>
                  </div>
                  <div className="flex justify-center">
                    <div className="h-5 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-7 w-[110px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div className="overflow-hidden">
                    <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-7 w-[110px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TaskListCard = () => {
  const {
    project,
    searchQuery,
    setSearchQuery,
    ordinalSearch,
    setOrdinalSearch,
    selectedAssignees,
    isAssigneePopoverOpen,
    setIsAssigneePopoverOpen,
    prioritySortAscending,
    members,
    limitedTasks,
    selectedStatus,
    handleDragEnd,
    handleStatusChange,
    handleAssigneeChange,
    toggleAssignee,
    getSelectedAssigneesDisplayText,
    createNewTask,
    handlePriorityHeaderClick,
    handleIdHeaderClick,
    handleStatusHeaderClick,
    getIdHeaderText,
    tasks,
  } = useTaskListCard();
  const { user, profile } = useAppData();
  const { canEdit } = useProjectRole();

  // Loading state determination
  const isLoading =
    !user ||
    !profile ||
    (tasks?.length && project?.id !== tasks?.[0]?.project_id);

  return (
    <div className="relative h-full flex-shrink-0">
      {isLoading ? (
        <TaskListCardSkeleton />
      ) : (
        <Card
          className={cn(
            "flex flex-col",
            "h-full max-h-[calc(100vh-100px)] md:max-h-[40rem] pb-3",
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Tasks ({limitedTasks.length})</CardTitle>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 min-w-[150px]"
                  disabled={!canEdit}
                />
              </div>
              <Input
                placeholder="Filter by ID..."
                value={ordinalSearch}
                onChange={e => setOrdinalSearch(e.target.value)}
                className="w-24"
                disabled={!canEdit}
              />
              <Popover
                open={isAssigneePopoverOpen}
                onOpenChange={setIsAssigneePopoverOpen}
              >
                <PopoverTrigger asChild disabled={!canEdit}>
                  <Button
                    variant="outline"
                    className="w-[150px] justify-between"
                    disabled={!canEdit}
                  >
                    <span className="truncate">
                      {getSelectedAssigneesDisplayText()}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[150px] p-0" align="end">
                  {members.map(member => (
                    <div
                      key={member.user_id}
                      role="button"
                      onClick={() => toggleAssignee(member.user_id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent",
                        selectedAssignees.includes(member.user_id) &&
                          "bg-accent",
                      )}
                    >
                      <span className="flex-1">
                        {member.profile?.display_name}
                      </span>
                      {selectedAssignees.includes(member.user_id) && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pb-3 flex flex-col overflow-hidden">
            <div className="border rounded-md flex flex-col overflow-hidden h-full">
              {/* Fixed header row that doesn't scroll */}
              <div className="grid grid-cols-[30px_60px_50px_120px_1fr_120px] bg-muted px-2 py-2 text-xs font-medium">
                <div></div>
                <button
                  onClick={canEdit ? handlePriorityHeaderClick : undefined}
                  className={cn(
                    "text-center flex items-center justify-center",
                    canEdit
                      ? "hover:underline cursor-pointer"
                      : "cursor-default",
                  )}
                  disabled={!canEdit}
                >
                  Priority
                  {prioritySortAscending ? (
                    <ChevronUp className="h-3 w-3 ml-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 ml-1" />
                  )}
                </button>
                <button
                  onClick={canEdit ? handleIdHeaderClick : undefined}
                  className={cn(
                    "text-center",
                    canEdit
                      ? "hover:underline cursor-pointer"
                      : "cursor-default",
                  )}
                  disabled={!canEdit}
                >
                  {getIdHeaderText()}
                </button>
                <button
                  onClick={canEdit ? handleStatusHeaderClick : undefined}
                  className={cn(
                    "flex items-center",
                    canEdit
                      ? "hover:underline cursor-pointer"
                      : "cursor-default",
                  )}
                  disabled={!canEdit}
                >
                  {selectedStatus
                    ? capitalizeFirstLetter(selectedStatus.replace("_", " "))
                    : "Status"}
                </button>
                <div>Title</div>
                <div>Assignee</div>
              </div>

              {/* Scrollable content */}
              <div
                className="overflow-y-auto"
                style={{ maxHeight: "calc(100% - 32px)" }}
              >
                <DragDropContext onDragEnd={canEdit ? handleDragEnd : () => {}}>
                  <Droppable droppableId="tasks">
                    {(provided: DroppableProvided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="divide-y"
                      >
                        {limitedTasks.map((task, index) => {
                          const assigneeProfile = task.assignee_profile;
                          const taskPath = configuration.paths.tasks.view({
                            project_slug: project?.slug,
                            ordinal_id: task.ordinal_id,
                          });

                          return (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                              isDragDisabled={!canEdit}
                            >
                              {(provided: DraggableProvided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="grid grid-cols-[30px_60px_50px_120px_1fr_120px] items-center px-2 pl-3.5 py-2"
                                >
                                  <div {...provided.dragHandleProps}>
                                    <Menu
                                      className={cn(
                                        "size-4 text-gray-500",
                                        canEdit
                                          ? "hover:text-black dark:hover:text-white cursor-grab"
                                          : "cursor-default",
                                      )}
                                    />
                                  </div>
                                  <div className="text-center">
                                    <span className="capitalize text-sm">
                                      <span className="text-base">
                                        {task.ordinal_priority || 1}{" "}
                                      </span>
                                      <span className="text-xs text-gray-600 dark:text-gray-300 lowercase">
                                        {!task.ordinal_priority ||
                                        task.ordinal_priority === 1
                                          ? "st"
                                          : task.ordinal_priority === 2
                                            ? "nd"
                                            : task.ordinal_priority === 3
                                              ? "rd"
                                              : "th"}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="flex justify-center">
                                    <Link
                                      href={taskPath}
                                      className="border-b border-gray-700 dark:border-gray-400 px-1 rounded-bl py-0.5"
                                    >
                                      {task.ordinal_id}
                                    </Link>
                                  </div>
                                  <div>
                                    <Select
                                      value={task.status}
                                      onValueChange={value =>
                                        handleStatusChange(task.id, value)
                                      }
                                      disabled={!canEdit}
                                    >
                                      <SelectTrigger className="w-[110px]">
                                        <SelectValue>
                                          <div className="flex items-center gap-1">
                                            <StatusIconSimple
                                              status={task.status}
                                            />
                                            <span className="capitalize text-xs">
                                              {task.status.replace("_", " ")}
                                            </span>
                                          </div>
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent>
                                        {[
                                          "backlog",
                                          "todo",
                                          "in_progress",
                                          "in_review",
                                          "completed",
                                        ].map(status => (
                                          <SelectItem
                                            key={status}
                                            value={status}
                                          >
                                            <div className="flex items-center gap-2">
                                              <StatusIconSimple
                                                status={status}
                                              />
                                              <span className="capitalize">
                                                {status.replace("_", " ")}
                                              </span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="overflow-hidden">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Link
                                            href={taskPath}
                                            className="hover:underline block truncate"
                                          >
                                            {task.title}
                                          </Link>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {task.title}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                  <div>
                                    <Select
                                      value={task.assignee || "unassigned"}
                                      onValueChange={value =>
                                        handleAssigneeChange(
                                          task.id,
                                          value === "unassigned" ? null : value,
                                        )
                                      }
                                      disabled={!canEdit}
                                    >
                                      <SelectTrigger className="w-[110px]">
                                        <SelectValue>
                                          <div className="flex items-center gap-1">
                                            <Avatar className="h-5 w-5">
                                              <AvatarImage
                                                src={
                                                  assigneeProfile?.avatar_url ||
                                                  undefined
                                                }
                                              />
                                              <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-700 dark:text-gray-100">
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
                                            <span className="text-xs truncate">
                                              {assigneeProfile?.display_name ||
                                                "Unassigned"}
                                            </span>
                                          </div>
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="unassigned">
                                          <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                              <AvatarFallback>
                                                UA
                                              </AvatarFallback>
                                            </Avatar>
                                            <span>Unassigned</span>
                                          </div>
                                        </SelectItem>
                                        {project?.project_members?.map(
                                          member => (
                                            <SelectItem
                                              key={member.user_id}
                                              value={member.user_id}
                                            >
                                              <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                  <AvatarImage
                                                    src={
                                                      member.profile
                                                        ?.avatar_url ||
                                                      undefined
                                                    }
                                                  />
                                                  <AvatarFallback>
                                                    {member.profile?.display_name?.slice(
                                                      0,
                                                      2,
                                                    ) || "??"}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <span>
                                                  {member.profile
                                                    ?.display_name ||
                                                    "Unknown User"}
                                                </span>
                                              </div>
                                            </SelectItem>
                                          ),
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskListCard;
