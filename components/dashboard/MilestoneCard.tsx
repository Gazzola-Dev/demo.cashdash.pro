"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import useAppData from "@/hooks/useAppData";
import { format } from "date-fns";
import { Calendar, Edit2, Save } from "lucide-react";
import { useState } from "react";

const MilestoneCard = () => {
  const { project } = useAppData();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "Q1 Deliverables",
    description: "Complete all planned features for the Q1 release cycle",
    dueDate: "2025-03-31",
  });

  // Mock milestone data - in a real implementation, this would come from API
  const milestone = {
    title: formData.title,
    description: formData.description,
    dueDate: new Date(formData.dueDate),
    progress: 65, // Percentage of completed tasks
    tasksTotal: 12,
    tasksCompleted: 8,
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    // In a real implementation, this would call an API
    setIsEditing(false);
  };

  const getDaysRemaining = () => {
    const today = new Date();
    const dueDate = new Date(formData.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  if (!project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Milestone</CardTitle>
          <CardDescription>No project selected</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="h-full">
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Milestone</CardTitle>
            <CardDescription>
              {isOpen
                ? isEditing
                  ? "Edit milestone information"
                  : "View milestone details"
                : "Progress tracker"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                disabled={!isOpen}
              >
                {isEditing ? (
                  <Save className="h-4 w-4" />
                ) : (
                  <Edit2 className="h-4 w-4" />
                )}
              </Button>
            )}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? "Collapse" : "Expand"}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        {/* Always visible content */}
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">{milestone.title}</div>
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span
                className={daysRemaining < 7 ? "text-red-500 font-medium" : ""}
              >
                {daysRemaining} days left
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress ({milestone.progress}%)</span>
              <span>
                {milestone.tasksCompleted}/{milestone.tasksTotal} tasks
              </span>
            </div>
            <Progress value={milestone.progress} className="h-2" />
          </div>
        </CardContent>

        {/* Expandable content */}
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Milestone Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-sm">
                    Description
                  </Label>
                  <p className="text-sm">{milestone.description}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground text-sm">
                    Due Date
                  </Label>
                  <p className="text-sm font-medium">
                    {format(milestone.dueDate, "MMMM d, yyyy")}
                  </p>
                </div>

                <div className="pt-1">
                  <p className="text-xs text-muted-foreground">
                    Created by:{" "}
                    {project.project_members?.[0]?.profile?.display_name ||
                      "Admin"}
                  </p>
                </div>
              </>
            )}
          </CardContent>

          {isEditing && (
            <CardFooter className="flex justify-between pt-0">
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({
                    title: milestone.title,
                    description: milestone.description || "",
                    dueDate: format(milestone.dueDate, "yyyy-MM-dd"),
                  });
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </CardFooter>
          )}
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default MilestoneCard;
