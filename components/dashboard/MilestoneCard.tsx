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
  useDeleteMilestone,
  useGetProjectMilestones,
  useSetCurrentMilestone,
  useUpdateMilestone,
} from "@/hooks/milestone.hooks";
import useAppData from "@/hooks/useAppData";
import { format, formatDistanceToNow, isValid } from "date-fns";
import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";
import { KeyboardEvent, useEffect, useState } from "react";

function MilestoneCard() {
  const { project, currentMilestone, isAdmin, refetch } = useAppData();
  const [isOpen, setIsOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const { data: milestones, refetch: refetchMilestones } =
    useGetProjectMilestones(project?.slug);
  const { setProjectCurrentMilestone, isPending } = useSetCurrentMilestone();
  const { createMilestone, isPending: isCreating } = useCreateMilestone();
  const { updateMilestone, isPending: isUpdating } = useUpdateMilestone();
  const { deleteMilestone, isPending: isDeleting } = useDeleteMilestone();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
        title: currentMilestone.title || "",
        description: currentMilestone.description || "",
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

  const handleSaveField = (fieldName: string) => {
    if (!currentMilestone) return;

    // Only update if the field has changed
    let updates: Record<string, any> = {};
    let hasChanged = false;

    if (fieldName === "title" && formData.title !== currentMilestone.title) {
      updates.title = formData.title;
      hasChanged = true;
    } else if (
      fieldName === "description" &&
      formData.description !== currentMilestone.description
    ) {
      updates.description = formData.description;
      hasChanged = true;
    } else if (fieldName === "dueDate" && formData.dueDate) {
      const currentDate = currentMilestone.due_date
        ? new Date(currentMilestone.due_date).toISOString().split("T")[0]
        : "";

      if (formData.dueDate !== currentDate) {
        updates.due_date = new Date(formData.dueDate).toISOString();
        hasChanged = true;
      }
    }

    if (hasChanged) {
      // Optimistically update the UI immediately
      const optimisticUpdate = { ...currentMilestone };
      if (updates.title !== undefined) optimisticUpdate.title = updates.title;
      if (updates.description !== undefined)
        optimisticUpdate.description = updates.description;
      if (updates.due_date !== undefined)
        optimisticUpdate.due_date = updates.due_date;

      // Call the API
      updateMilestone(currentMilestone.id, updates);
    }

    setEditingField(null);
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    fieldName: string,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveField(fieldName);
    } else if (e.key === "Escape") {
      setEditingField(null);
      // Reset form data to current milestone values
      if (currentMilestone) {
        if (fieldName === "title") {
          setFormData(prev => ({
            ...prev,
            title: currentMilestone.title || "",
          }));
        } else if (fieldName === "description") {
          setFormData(prev => ({
            ...prev,
            description: currentMilestone.description || "",
          }));
        } else if (fieldName === "dueDate") {
          setFormData(prev => ({
            ...prev,
            dueDate: currentMilestone.due_date
              ? new Date(currentMilestone.due_date).toISOString().split("T")[0]
              : "",
          }));
        }
      }
    }
  };

  const handleBlur = (fieldName: string) => {
    handleSaveField(fieldName);
  };

  const handleMilestoneChange = (milestoneId: string) => {
    setProjectCurrentMilestone(milestoneId === "none" ? null : milestoneId);
    // Refetch data after a short delay to ensure the UI updates
  };

  const handleCreateMilestone = () => {
    setIsDialogOpen(false);
    createMilestone();
  };

  const handleDeleteMilestone = () => {
    setIsDeleteDialogOpen(false);
    if (currentMilestone) {
      deleteMilestone(currentMilestone.id);
    }
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
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDialogOpen(true)}
                    disabled={isCreating}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                  {currentMilestone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  )}
                </>
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
                        onBlur={() => handleBlur("title")}
                        onKeyDown={e => handleKeyDown(e, "title")}
                        autoFocus
                        className="max-w-[200px]"
                        placeholder="Enter milestone title"
                      />
                    ) : (
                      currentMilestone.title ||
                      formData.title ||
                      "Untitled Milestone"
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
                      onBlur={() => handleBlur("description")}
                      onKeyDown={e => handleKeyDown(e, "description")}
                      autoFocus
                      rows={3}
                      placeholder="Enter milestone description"
                    />
                  ) : (
                    <p
                      className="text-sm cursor-text"
                      onClick={() => isAdmin && setEditingField("description")}
                    >
                      {currentMilestone.description || formData.description || (
                        <span className="text-muted-foreground italic">
                          No description provided
                        </span>
                      )}
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
                      onBlur={() => handleBlur("dueDate")}
                      onKeyDown={e => handleKeyDown(e, "dueDate")}
                      autoFocus
                    />
                  ) : (
                    <p
                      className="text-sm font-medium cursor-text"
                      onClick={() => isAdmin && setEditingField("dueDate")}
                    >
                      {formData.dueDate !== null &&
                      currentMilestone.due_date !== null ? (
                        format(
                          new Date(
                            formData.dueDate || currentMilestone.due_date,
                          ),
                          "MMMM d, yyyy",
                        )
                      ) : (
                        <span className="text-muted-foreground italic">
                          No due date set
                        </span>
                      )}
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

      {/* Confirmation Dialog for Adding Milestone */}
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

      {/* Confirmation Dialog for Deleting Milestone */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Milestone</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this milestone? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMilestone}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Milestone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default MilestoneCard;
