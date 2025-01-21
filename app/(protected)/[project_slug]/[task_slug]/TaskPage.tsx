"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useGetTask, useUpdateTask } from "@/hooks/task.hooks";
import { TaskWithDetails } from "@/types/task.types";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  LinkIcon,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";

interface TaskPageProps {
  projectSlug: string;
  taskSlug: string;
  initialData: TaskWithDetails;
}

const TaskPage = ({ projectSlug, taskSlug, initialData }: TaskPageProps) => {
  const { data: task } = useGetTask(taskSlug, { initialData });
  const { mutate: updateTask } = useUpdateTask();

  if (!task) {
    return <div className="p-8">Loading...</div>;
  }

  console.log(task);

  const handleStatusChange = (checked: boolean) => {
    updateTask({
      slug: task.slug,
      updates: {
        status: checked ? "completed" : "todo",
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Checkbox
                  checked={task.status === "completed"}
                  onCheckedChange={handleStatusChange}
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {task.prefix}-{task.ordinal_id}
                  </span>
                  <Button variant="ghost" size="sm">
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <h1 className="text-2xl font-semibold mb-2">{task.title}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Created {format(new Date(task.created_at), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {task.comments?.length || 0} comments
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                {task.description ? (
                  <div className="prose dark:prose-invert">
                    {JSON.stringify(task.description)}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No description provided
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent>
                {task.comments?.map(comment => (
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
                          {JSON.stringify(comment.content)}
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
            {/* Actions */}
            <div className="flex justify-between items-center">
              <Button variant="outline">Assign</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Status Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Button
                      variant="outline"
                      className="w-full mt-1 justify-start capitalize"
                    >
                      {task.status}
                    </Button>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Button
                      variant="outline"
                      className="w-full mt-1 justify-start capitalize"
                    >
                      {task.priority}
                    </Button>
                  </div>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium">Due Date</label>
                    <Button
                      variant="outline"
                      className="w-full mt-1 justify-start"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Set due date
                    </Button>
                  </div>
                  {task.task_schedule?.[0] && (
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Estimated hours</span>
                        <span>{task.task_schedule[0].estimated_hours}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Actual hours</span>
                        <span>{task.task_schedule[0].actual_hours}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Subtasks Card */}
            {task.subtasks && task.subtasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Subtasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {task.subtasks.map(subtask => (
                      <div key={subtask.id} className="flex items-center gap-2">
                        <Checkbox checked={subtask.status === "completed"} />
                        <span>{subtask.title}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskPage;
