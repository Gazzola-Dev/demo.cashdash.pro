"use client";

import { TaskComments } from "@/components/tasks/TaskPage/TaskComments";
import { TaskDescription } from "@/components/tasks/TaskPage/TaskDescription";
import { TaskHeader } from "@/components/tasks/TaskPage/TaskHeader";
import { TaskSidebar } from "@/components/tasks/TaskPage/TaskSidebar";
import { useCreateComment, useUpdateComment } from "@/hooks/comment.hooks";
import { useListMembers } from "@/hooks/member.hooks";
import { useGetTask, useUpdateTask } from "@/hooks/task.hooks";
import { TaskResult } from "@/types/task.types";

interface TaskPageProps {
  projectSlug: string;
  taskSlug: string;
  initialData: TaskResult;
}

const TaskPage = ({ projectSlug, taskSlug, initialData }: TaskPageProps) => {
  const { data: taskData } = useGetTask(taskSlug, { initialData });
  const { data: members = [] } = useListMembers(projectSlug);
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: createComment } = useCreateComment(taskData?.task?.id);
  const { mutate: updateComment } = useUpdateComment();

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

  const handleSaveTitle = (title: string) => {
    handleUpdateTask({ title });
  };

  const handleSaveDescription = (description: string) => {
    handleUpdateTask({ description });
  };

  const handleCommentSubmit = (comment: string) => {
    createComment(comment);
  };

  const handleUpdateComment = (commentId: string, content: string) => {
    updateComment({ id: commentId, content });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto pt-2 pb-6 px-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2">
            <TaskHeader task={task} onSave={handleSaveTitle} />
            <TaskDescription
              description={task.description || ""}
              onSave={handleSaveDescription}
            />
            <TaskComments
              comments={comments}
              onSubmitComment={handleCommentSubmit}
              onUpdateComment={handleUpdateComment}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <TaskSidebar
              task={task}
              members={members}
              assigneeProfile={assignee_profile}
              taskSchedule={task_schedule}
              onUpdateTask={handleUpdateTask}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskPage;
