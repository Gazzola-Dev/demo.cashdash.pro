"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const MilestoneCard = () => {
  const { project } = useAppData();
  const [isOpen, setIsOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
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

  const handleBlur = () => {
    // In a real implementation, this would call an API
    setEditingField(null);
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
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="h-full w-full md:w-1/2"
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Milestone</CardTitle>
            <CardDescription>
              {isOpen ? "Milestone details" : "Progress tracker"}
            </CardDescription>
          </div>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
            >
              {isOpen ? (
                <>
                  Collapse <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Milestone details <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>

        {/* Always visible content */}
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div
              className="font-medium cursor-text"
              onClick={() => setEditingField("title")}
            >
              {editingField === "title" ? (
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoFocus
                  className="max-w-[200px]"
                />
              ) : (
                milestone.title
              )}
            </div>
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
            <div className="space-y-1">
              <Label className="text-muted-foreground text-sm">
                Description
              </Label>
              {editingField === "description" ? (
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoFocus
                  rows={3}
                />
              ) : (
                <p
                  className="text-sm cursor-text"
                  onClick={() => setEditingField("description")}
                >
                  {milestone.description || "No description provided"}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-sm">Due Date</Label>
              {editingField === "dueDate" ? (
                <Input
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoFocus
                />
              ) : (
                <p
                  className="text-sm font-medium cursor-text"
                  onClick={() => setEditingField("dueDate")}
                >
                  {format(milestone.dueDate, "MMMM d, yyyy")}
                </p>
              )}
            </div>

            <div className="pt-1">
              <p className="text-xs text-muted-foreground">
                Created by:{" "}
                {project.project_members?.[0]?.profile?.display_name || "Admin"}
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default MilestoneCard;
