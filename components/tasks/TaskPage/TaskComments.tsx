import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { TaskResult } from "@/types/task.types";
import { format } from "date-fns";
import { useState } from "react";

interface TaskCommentsProps {
  comments: TaskResult["comments"];
  onSubmitComment: (comment: string) => void;
}

export function TaskComments({
  comments = [],
  onSubmitComment,
}: TaskCommentsProps) {
  const [newComment, setNewComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitComment(newComment);
    setNewComment("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        {/* New Comment Form */}
        <form onSubmit={handleSubmit} className="mb-6">
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
        {comments?.reverse().map((comment, index) => (
          <div key={`${comment.id}-${index}`} className="mb-4">
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
                    {format(new Date(comment.created_at), "MMM d, yyyy")}
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
  );
}
