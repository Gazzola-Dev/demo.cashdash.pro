import { StatusIconSimple } from "@/components/tasks/SimpleTaskSelectComponents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import useDemoData from "@/hooks/useDemoData";
import { capitalizeFirstLetter } from "@/lib/string.util";
import { TaskResult } from "@/types/task.types";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Menu, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const TaskListCard = () => {
  const { project } = useDemoData();
  const [tasks, setTasks] = useState<TaskResult[]>(project?.tasks || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [ordinalSearch, setOrdinalSearch] = useState("");

  // Filter tasks based on search queries
  const filteredTasks = tasks.filter(taskResult => {
    const titleMatch = taskResult.task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const ordinalMatch = ordinalSearch
      ? taskResult.task.ordinal_id.toString().includes(ordinalSearch)
      : true;
    return titleMatch && ordinalMatch;
  });

  // Sort tasks by ordinal priority
  const sortedTasks = [...filteredTasks].sort(
    (a, b) => a.task.ordinal_priority - b.task.ordinal_priority,
  );

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update ordinal priorities based on new positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      task: {
        ...item.task,
        ordinal_priority: index + 1,
      },
    }));

    setTasks(updatedItems);
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.task.id === taskId
          ? { ...task, task: { ...task.task, status: newStatus as any } }
          : task,
      ),
    );
  };

  const handleAssigneeChange = (
    taskId: string,
    newAssigneeId: string | null,
  ) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.task.id === taskId
          ? { ...task, task: { ...task.task, assignee: newAssigneeId } }
          : task,
      ),
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tasks ({sortedTasks.length})</CardTitle>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-64 pl-8"
            />
          </div>
          <Input
            placeholder="Filter by ID..."
            value={ordinalSearch}
            onChange={e => setOrdinalSearch(e.target.value)}
            className="w-32"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border select-none">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tasks">
              {provided => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="divide-y"
                >
                  <div className="grid grid-cols-[40px_80px_80px_140px_1fr_200px] bg-muted px-4 py-2 text-sm font-medium">
                    <div></div>
                    <div className="text-center">Priority</div>
                    <div className="text-center">ID</div>
                    <div>Status</div>
                    <div>Title</div>
                    <div>Assignee</div>
                  </div>
                  {sortedTasks.map((taskResult, index) => {
                    const task = taskResult.task;
                    const assigneeProfile = taskResult.assignee_profile;
                    const taskPath = configuration.paths.tasks.view({
                      project_slug: project?.slug,
                      ordinal_id: task.ordinal_id,
                    });

                    return (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {provided => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="grid grid-cols-[40px_80px_80px_140px_1fr_200px] items-center px-4 py-2"
                          >
                            <div {...provided.dragHandleProps}>
                              <Menu className="size-4 text-gray-500 hover:text-black dark:hover:text-white cursor-grab" />
                            </div>
                            <div className="text-center">
                              <span className="capitalize text-sm">
                                <span className="text-base">
                                  {task.ordinal_priority}{" "}
                                </span>
                                <span className="text-xs text-gray-600 dark:text-gray-300 lowercase">
                                  {task.ordinal_priority === 1
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
                                className="hover:underline border border-gray-700 dark:border-gray-400 px-1.5 rounded py-0.5"
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
                              >
                                <SelectTrigger className="w-[130px]">
                                  <SelectValue>
                                    <div className="flex items-center gap-2">
                                      <StatusIconSimple status={task.status} />
                                      <span className="capitalize">
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
                                    <SelectItem key={status} value={status}>
                                      <div className="flex items-center gap-2">
                                        <StatusIconSimple status={status} />
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
                                  <TooltipContent>{task.title}</TooltipContent>
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
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-6 w-6">
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
                                      <span className="text-sm">
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
                                        <AvatarFallback>UA</AvatarFallback>
                                      </Avatar>
                                      <span>Unassigned</span>
                                    </div>
                                  </SelectItem>
                                  {project?.project_members?.map(member => (
                                    <SelectItem
                                      key={member.user_id}
                                      value={member.user_id}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                          <AvatarImage
                                            src={
                                              member.profile?.avatar_url ||
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
                                          {member.profile?.display_name ||
                                            "Unknown User"}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
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
      </CardContent>
    </Card>
  );
};

export default TaskListCard;
