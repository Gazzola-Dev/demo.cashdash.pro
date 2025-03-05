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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateMilestone,
  useGetProjectMilestones,
  useSetCurrentMilestone,
} from "@/hooks/milestone.hooks";
import useAppData from "@/hooks/useAppData";
import { format, formatDistanceToNow, isValid } from "date-fns";
import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Clock,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";

const MilestoneCard = () => {
  const { project, currentMilestone, isAdmin, refetch } = useAppData();
  const [isOpen, setIsOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const { data: milestones, refetch: refetchMilestones } =
    useGetProjectMilestones(project?.slug);
  const { setProjectCurrentMilestone, isPending } = useSetCurrentMilestone();
  const { createMilestone, isPending: isCreating } = useCreateMilestone();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: currentMilestone?.title || "No milestone selected",
    description: currentMilestone?.description || "No description available",
    dueDate: currentMilestone?.due_date
      ? new Date(currentMilestone.due_date).toISOString().split("T")[0]
      : "",
  });

  // Update form data when currentMilestone changes
  useEffect(() => {
    if (currentMilestone) {
      setFormData({
        title: currentMilestone.title || "No milestone selected",
        description: currentMilestone.description || "No description available",
        dueDate: currentMilestone.due_date
          ? new Date(currentMilestone.due_date).toISOString().split("T")[0]
          : "",
      });
    }
  }, [currentMilestone]);

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
    // In a real implementation, this would call an API to update the milestone
    setEditingField(null);
  };

  const handleMilestoneChange = (milestoneId: string) => {
    setProjectCurrentMilestone(milestoneId === "none" ? null : milestoneId);
    // Refetch data after a short delay to ensure the UI updates
    setTimeout(() => {
      refetch();
      refetchMilestones();
    }, 500);
  };

  const handleCreateMilestone = () => {
    setIsDialogOpen(false);
    createMilestone();
  };

  // Calculate milestone progress
  const getProgress = () => {
    if (!currentMilestone) return 0;

    const tasksTotal = currentMilestone.tasks_count || 0;
    if (tasksTotal === 0) return 0;

    const tasksCompleted = currentMilestone.tasks_completed || 0;
    return Math.round((tasksCompleted / tasksTotal) * 100);
  };

  const getDaysRemaining = () => {
    if (!currentMilestone?.due_date) return null;

    const dueDate = new Date(currentMilestone.due_date);
    if (!isValid(dueDate)) return null;

    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const progress = getProgress();
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
    <>
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
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDialogOpen(true)}
                  disabled={isCreating}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
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
            </div>
          </CardHeader>

          {/* Milestone selector for admins */}
          {isAdmin && (
            <CardContent className="pt-0 pb-2">
              <Select
                value={currentMilestone?.id || "none"}
                onValueChange={handleMilestoneChange}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a milestone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {milestones?.map(milestone => (
                    <SelectItem key={milestone.id} value={milestone.id}>
                      {milestone.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          )}

          {/* Always visible content */}
          <CardContent className="space-y-4">
            {!currentMilestone ? (
              <div className="text-center p-4 text-muted-foreground">
                No milestone selected
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div
                    className="font-medium cursor-text"
                    onClick={() => isAdmin && setEditingField("title")}
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
                      currentMilestone.title
                    )}
                  </div>
                  {daysRemaining !== null && (
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span
                        className={
                          daysRemaining < 7 ? "text-red-500 font-medium" : ""
                        }
                      >
                        {daysRemaining <= 0
                          ? "Overdue"
                          : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress ({progress}%)</span>
                    {currentMilestone.tasks_count !== undefined && (
                      <span>
                        {currentMilestone.tasks_completed || 0}/
                        {currentMilestone.tasks_count} tasks
                      </span>
                    )}
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </>
            )}
          </CardContent>

          {/* Expandable content */}
          <CollapsibleContent>
            {currentMilestone ? (
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
                      onClick={() => isAdmin && setEditingField("description")}
                    >
                      {currentMilestone.description ||
                        "No description provided"}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground text-sm">
                    Due Date
                  </Label>
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
                      onClick={() => isAdmin && setEditingField("dueDate")}
                    >
                      {currentMilestone.due_date
                        ? format(
                            new Date(currentMilestone.due_date),
                            "MMMM d, yyyy",
                          )
                        : "No due date set"}
                    </p>
                  )}
                </div>

                {currentMilestone.start_date && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-sm">
                      Start Date
                    </Label>
                    <p className="text-sm">
                      {format(
                        new Date(currentMilestone.start_date),
                        "MMMM d, yyyy",
                      )}
                    </p>
                  </div>
                )}

                <div className="pt-1">
                  <p className="text-xs text-muted-foreground">
                    Created:{" "}
                    {formatDistanceToNow(
                      new Date(currentMilestone.created_at),
                      {
                        addSuffix: true,
                      },
                    )}
                  </p>
                  {currentMilestone.updated_at && (
                    <p className="text-xs text-muted-foreground">
                      Updated:{" "}
                      {formatDistanceToNow(
                        new Date(currentMilestone.updated_at),
                        { addSuffix: true },
                      )}
                    </p>
                  )}
                </div>
              </CardContent>
            ) : (
              <CardContent className="py-4 text-center text-muted-foreground">
                Select a milestone to view details
              </CardContent>
            )}
          </CollapsibleContent>

          {currentMilestone && (
            <CardFooter className="text-xs text-muted-foreground">
              <div className="flex items-center">
                <CalendarIcon className="h-3 w-3 mr-1" />
                Status:{" "}
                <span className="ml-1 capitalize">
                  {currentMilestone.status}
                </span>
              </div>
            </CardFooter>
          )}
        </Card>
      </Collapsible>

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Milestone</DialogTitle>
            <DialogDescription>
              This will create a new blank milestone and set it as the current
              one for this project.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMilestone} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Milestone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MilestoneCard;
