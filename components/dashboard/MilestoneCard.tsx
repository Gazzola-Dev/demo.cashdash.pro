"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { useAppData } from "@/stores/app.store";
import { format, formatDistanceToNow, isValid } from "date-fns";
import {
  ArchiveIcon,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  PlayCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { KeyboardEvent, useEffect, useState } from "react";

// Loading Skeleton Component
const MilestoneCardSkeleton = () => {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Milestone</CardTitle>
        </div>
        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Only showing progress section since it's visible when collapsed */}

        <div className="h-6 w-full bg-gray-200 dark:bg-gray-700 rounded py-4"></div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </CardContent>
    </Card>
  );
};

function MilestoneCard() {
  const {
    project,
    milestone: currentMilestone,
    isAdmin,
    user,
    profile,
  } = useAppData();
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

  // Loading state determination
  const isLoading = !user || !profile || (milestones && !project);

  const [formData, setFormData] = useState({
    title: currentMilestone?.title || "No milestone selected",
    description: currentMilestone?.description || "No description available",
    dueDate: currentMilestone?.due_date
      ? new Date(currentMilestone.due_date).toISOString().split("T")[0]
      : "",
    status:
      currentMilestone?.status ||
      ("draft" as "draft" | "active" | "completed" | "archived"),
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
        status:
          currentMilestone.status ||
          ("draft" as "draft" | "active" | "completed" | "archived"),
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

  const handleStatusChange = (value: string) => {
    if (!currentMilestone || !isAdmin) return;

    // Ensure value is cast to the correct type
    const typedValue = value as "draft" | "active" | "completed" | "archived";

    setFormData(prev => ({
      ...prev,
      status: typedValue,
    }));

    updateMilestone(currentMilestone.id, { status: typedValue });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return null;
      case "active":
        return <PlayCircle className="h-4 w-4 text-green-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "archived":
        return <ArchiveIcon className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const handleSaveField = (fieldName: string) => {
    if (!currentMilestone || !isAdmin) return;

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
    if (!isAdmin) return;
    setProjectCurrentMilestone(milestoneId);
  };

  const handleCreateMilestone = () => {
    if (!isAdmin) return;
    setIsDialogOpen(false);
    createMilestone();
  };

  const handleDeleteMilestone = () => {
    if (!isAdmin) return;
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

  if (isLoading) {
    return (
      <div className="h-full w-full">
        <MilestoneCardSkeleton />
      </div>
    );
  }

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
        className="h-full w-full"
      >
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Milestone</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && isOpen && (
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
                      Details <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>

          {/* Milestone selector for admins */}
          {isAdmin && (
            <CardContent className="pt-4 mb-4 pb-2">
              <Select
                value={currentMilestone?.id || ""}
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

          {/* Main content */}
          <CardContent className="space-y-4">
            {!currentMilestone ? (
              <div className="text-center p-4 text-muted-foreground">
                No milestone selected
              </div>
            ) : (
              <>
                {isOpen && (
                  <>
                    <div className="space-y-2">
                      <Label
                        className="text-sm font-bold text-gray-500 dark:text-gray-400"
                        htmlFor="title"
                      >
                        Milestone Name
                      </Label>
                      {isAdmin && editingField === "title" ? (
                        <Input
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleChange}
                          onBlur={() => handleBlur("title")}
                          onKeyDown={e => handleKeyDown(e, "title")}
                          className="h-8"
                          autoFocus
                          disabled={isPending}
                        />
                      ) : (
                        <p
                          className="text-sm cursor-text bg-gray-50/70 dark:bg-gray-900 rounded py-1 px-2"
                          onClick={() => isAdmin && setEditingField("title")}
                        >
                          {currentMilestone.title || "Untitled Milestone"}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        className="text-sm font-bold text-gray-500 dark:text-gray-400"
                        htmlFor="status"
                      >
                        Status
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={handleStatusChange}
                        disabled={!isAdmin || isPending}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(formData.status)}
                              <span className="capitalize">
                                {formData.status}
                              </span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">
                            <div className="flex items-center gap-2">Draft</div>
                          </SelectItem>
                          <SelectItem value="active">
                            <div className="flex items-center gap-2">
                              <PlayCircle className="h-4 w-4 text-green-500" />
                              Active
                            </div>
                          </SelectItem>
                          <SelectItem value="completed">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                              Completed
                            </div>
                          </SelectItem>
                          <SelectItem value="archived">
                            <div className="flex items-center gap-2">
                              <ArchiveIcon className="h-4 w-4 text-gray-500" />
                              Archived
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        className="text-sm font-bold text-gray-500 dark:text-gray-400"
                        htmlFor="description"
                      >
                        Description
                      </Label>
                      {isAdmin && editingField === "description" ? (
                        <Textarea
                          id="description"
                          name="description"
                          value={formData.description || ""}
                          onChange={handleChange}
                          onBlur={() => handleBlur("description")}
                          onKeyDown={e => handleKeyDown(e, "description")}
                          placeholder="Milestone description"
                          rows={4}
                          autoFocus
                          disabled={isPending}
                        />
                      ) : (
                        <p
                          className="text-sm cursor-text bg-gray-50/70 dark:bg-gray-900 rounded py-1 px-2"
                          onClick={() =>
                            isAdmin && setEditingField("description")
                          }
                        >
                          {currentMilestone.description || (
                            <span className="text-gray-500 italic">
                              No description provided
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        className="text-sm font-bold text-gray-500 dark:text-gray-400"
                        htmlFor="dueDate"
                      >
                        Due Date
                      </Label>
                      {isAdmin && editingField === "dueDate" ? (
                        <Input
                          id="dueDate"
                          name="dueDate"
                          type="date"
                          value={formData.dueDate}
                          onChange={handleChange}
                          onBlur={() => handleBlur("dueDate")}
                          onKeyDown={e => handleKeyDown(e, "dueDate")}
                          autoFocus
                          disabled={isPending}
                        />
                      ) : (
                        <p
                          className="text-sm cursor-text bg-gray-50/70 dark:bg-gray-900 rounded py-1 px-2"
                          onClick={() => isAdmin && setEditingField("dueDate")}
                        >
                          {currentMilestone.due_date !== null ? (
                            format(
                              new Date(currentMilestone.due_date),
                              "MMMM d, yyyy",
                            )
                          ) : (
                            <span className="text-gray-500 italic">
                              No due date set
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    {currentMilestone.start_date && (
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-500 dark:text-gray-400">
                          Start Date
                        </Label>
                        <p className="text-sm bg-gray-50/70 dark:bg-gray-900 rounded py-1 px-2">
                          {format(
                            new Date(currentMilestone.start_date),
                            "MMMM d, yyyy",
                          )}
                        </p>
                      </div>
                    )}
                  </>
                )}
                <div className="space-y-2">
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
                </div>
                {isOpen && isAdmin && daysRemaining !== null && (
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-500 dark:text-gray-400">
                      Time Remaining
                    </Label>
                    <div className="flex items-center gap-1 text-sm bg-gray-50/70 dark:bg-gray-900 rounded py-1 px-2">
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
                  </div>
                )}
                {isOpen && isAdmin && (
                  <div className="pt-2 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                        Created:
                      </span>{" "}
                      {formatDistanceToNow(
                        new Date(currentMilestone.created_at),
                        {
                          addSuffix: true,
                        },
                      )}
                    </p>
                    {currentMilestone.updated_at && (
                      <p className="text-xs text-muted-foreground">
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                          Updated:
                        </span>{" "}
                        {formatDistanceToNow(
                          new Date(currentMilestone.updated_at),
                          { addSuffix: true },
                        )}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
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
