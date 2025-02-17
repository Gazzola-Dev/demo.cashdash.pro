import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { USER_ID } from "@/data/demo.util";
import useDemoData from "@/hooks/useDemoData";
import { capitalizeFirstLetter } from "@/lib/string.util";
import { TaskResult } from "@/types/task.types";
import { format } from "date-fns";
import { Edit2, Save } from "lucide-react";
import { KeyboardEvent, useState } from "react";

interface TaskCommentsProps {
  comments: TaskResult["comments"];
  onSubmitComment: (comment: string) => void;
  onUpdateComment?: (commentId: string, content: string) => void;
}

interface CommentItemProps {
  comment: NonNullable<TaskResult["comments"]>[0];
  onUpdateComment?: (commentId: string, content: string) => void;
}

function CommentItem({ comment, onUpdateComment }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content || "");

  const isAuthor = USER_ID === comment.user_id;

  const handleSave = () => {
    if (onUpdateComment && editedContent.trim()) {
      onUpdateComment(comment.id, editedContent);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      handleSave();
    } else if (event.key === "Escape") {
      setEditedContent(comment.content || "");
      setIsEditing(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 ">
          <AvatarImage src={comment.user.avatar_url || ""} />
          <AvatarFallback className="rounded bg-gray-200 dark:bg-gray-700 dark:text-gray-100">
            {capitalizeFirstLetter(
              comment.user.display_name?.slice(0, 2) || "?",
            )}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {comment.user.display_name || "New user"}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {format(new Date(comment.created_at), "MMM d, yyyy h:mm a")}
              </span>
              {isAuthor && onUpdateComment && (
                <>
                  {!isEditing ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleSave}
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="mt-2 prose dark:prose-invert">
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={e => setEditedContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[100px]"
                autoFocus
              />
            ) : (
              <div className="whitespace-pre-line">{comment.content}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TaskComments() {
  const [newComment, setNewComment] = useState("");
  const { task } = useDemoData();
  const comments = task?.comments;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && newComment.trim()) {
      e.preventDefault();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="mb-6">
          <Textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment... (Press Ctrl+Enter or Cmd+Enter to submit)"
            className="mb-2"
          />
          <Button type="submit" disabled={!newComment.trim()}>
            Submit
          </Button>
        </form>

        {comments
          ?.reverse()
          .map((comment, index) => (
            <CommentItem
              key={`${comment.id}-${index}`}
              comment={comment}
              onUpdateComment={() => {}}
            />
          ))}
      </CardContent>
    </Card>
  );
}
