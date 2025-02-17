import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Save } from "lucide-react";
import { useState } from "react";

interface TaskDescriptionProps {
  description: string;
  onSave: (description: string) => void;
}

export function TaskDescription({ description, onSave }: TaskDescriptionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(description);

  const handleSave = () => {
    onSave(editedDescription);
    setIsEditing(false);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Description</CardTitle>
        {!isEditing ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={handleSave}>
            <Save className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={editedDescription}
            onChange={e => setEditedDescription(e.target.value)}
            className="min-h-[100px]"
          />
        ) : (
          <div className="prose dark:prose-invert whitespace-pre-line">
            {description || "No description provided"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
