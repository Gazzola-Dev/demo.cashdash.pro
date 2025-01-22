"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useListMembers } from "@/hooks/member.hooks";
import { useGetTask, useUpdateTask } from "@/hooks/task.hooks";
import { cn } from "@/lib/utils";
import { TaskResult } from "@/types/task.types";
import { format } from "date-fns";
import { CalendarIcon, Edit2, Save } from "lucide-react";
import { useState } from "react";

interface TaskPageProps {
  projectSlug: string;
  taskSlug: string;
  initialData: TaskResult;
}

const TaskPage = ({ projectSlug, taskSlug, initialData }: TaskPageProps) => {
  const { data: taskData } = useGetTask(taskSlug, { initialData });
  const { data: members = [] } = useListMembers(
    taskData?.task.project_id || "",
  );
  const { mutate: updateTask } = useUpdateTask();

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(
    taskData?.task.description || "",
  );
  const [newComment, setNewComment] = useState("");

  if (!taskData) {
    return <div className="p-8">Loading...</div>;
  }

  const {
    task,
    comments = [],
    assignee_profile,
    project,
    task_schedule,
  } = taskData;

  const handleUpdateTask = (updates: any) => {
    updateTask({
      slug: task.slug,
      updates,
    });
  };

  const handleSaveDescription = () => {
    handleUpdateTask({ description: editedDescription });
    setIsEditingDescription(false);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add comment mutation would go here
    setNewComment("");
  };

  const handleDueDateChange = (date: Date | undefined) => {
    if (!date) return;

    // First get or create task schedule
    const schedule = task_schedule?.[0] || {};
    handleUpdateTask({
      task_schedule: [
        {
          ...schedule,
          due_date: date.toISOString(),
        },
      ],
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto pt-2 pb-6 px-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold mb-2">{task.title}</h1>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Created {format(new Date(task.created_at), "MMM d, yyyy")}
                </div>
              </div>
            </div>

            {/* Description */}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Description</CardTitle>
                {!isEditingDescription ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSaveDescription}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditingDescription ? (
                  <Textarea
                    value={editedDescription}
                    onChange={e => setEditedDescription(e.target.value)}
                    className="min-h-[100px]"
                  />
                ) : (
                  <div className="prose dark:prose-invert">
                    {task.description || "No description provided"}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent>
                {/* New Comment Form */}
                <form onSubmit={handleCommentSubmit} className="mb-6">
                  <Textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="mb-2"
                  />
                  <Button type="submit" disabled={!newComment.trim()}>
                    Submit
                  </Button>
                </form>

                {/* Comment List */}
                {comments?.reverse().map(comment => (
                  <div key={comment.id} className="mb-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user.avatar_url || ""} />
                        <AvatarFallback>
                          {comment.user.display_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {comment.user.display_name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(
                              new Date(comment.created_at),
                              "MMM d, yyyy",
                            )}
                          </span>
                        </div>
                        <div className="mt-2 prose dark:prose-invert">
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Assignee */}
                  <div>
                    <label className="text-sm font-medium">Assignee</label>
                    <Select
                      value={task.assignee || "unassigned"}
                      onValueChange={value =>
                        handleUpdateTask({
                          assignee: value === "unassigned" ? null : value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {assignee_profile ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={assignee_profile.avatar_url || undefined}
                                />
                                <AvatarFallback>
                                  {assignee_profile.display_name?.charAt(0) ||
                                    "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {assignee_profile.display_name ||
                                  "Unnamed User"}
                              </span>
                            </div>
                          ) : (
                            "Unassigned"
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {members.map(member => (
                          <SelectItem
                            key={member.user_id}
                            value={member.user_id}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={member.profile?.avatar_url || undefined}
                                />
                                <AvatarFallback>
                                  {member.profile?.display_name?.charAt(0) ||
                                    "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {member.profile?.display_name || "Unnamed User"}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={task.status}
                      onValueChange={value =>
                        handleUpdateTask({ status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="backlog">Backlog</SelectItem>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select
                      value={task.priority}
                      onValueChange={value =>
                        handleUpdateTask({ priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="text-sm font-medium">Due Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !task_schedule?.[0]?.due_date &&
                              "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {task_schedule?.[0]?.due_date ? (
                            format(new Date(task_schedule[0].due_date), "PPP")
                          ) : (
                            <span>Set due date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            task_schedule?.[0]?.due_date
                              ? new Date(task_schedule[0].due_date)
                              : undefined
                          }
                          onSelect={handleDueDateChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskPage;
