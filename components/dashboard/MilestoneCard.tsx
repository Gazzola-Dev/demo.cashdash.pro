"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useMilestoneCard } from "@/hooks/milestone.hooks";
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

// Loading Skeleton Component
export const MilestoneCardSkeleton = () => {
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
    isOpen,
    setIsOpen,
    isDialogOpen,
    setIsDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    editingField,
    setEditingField,
    isPending,
    isCreating,
    isDeleting,
    formData,
    progress,
    daysRemaining,
    canEdit,
    isAdmin,
    milestone: currentMilestone,
    milestones,
    formatDate,
    getTimeAgo,
    handleChange,
    handleStatusChange,
    handleMilestoneChange,
    handleKeyDown,
    handleBlur,
    handleCreateMilestone,
    handleDeleteMilestone,
  } = useMilestoneCard();

  // Get status icon based on milestone status
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

  return (
    <>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="h-full w-full"
        id="milestone-card"
      >
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Milestone</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && isOpen && (
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
          {canEdit && (
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
                    <SelectItem key={milestone.id} value={milestone.id ?? ""}>
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
                      {canEdit && editingField === "title" ? (
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
                          className={`text-sm ${canEdit ? "cursor-text" : ""} bg-gray-50/70 dark:bg-gray-900 rounded py-1 px-2`}
                          onClick={() => canEdit && setEditingField("title")}
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
                        disabled={!canEdit || isPending}
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
                            <div className="flex items-center gap-2">
                              <PlayCircle className="h-4 w-4 text-gray-500" />
                              Draft
                            </div>
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
                      {canEdit && editingField === "description" ? (
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
                          className={`text-sm ${canEdit ? "cursor-text" : ""} bg-gray-50/70 dark:bg-gray-900 rounded py-1 px-2`}
                          onClick={() =>
                            canEdit && setEditingField("description")
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
                      {canEdit && editingField === "dueDate" ? (
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
                          className={`text-sm ${canEdit ? "cursor-text" : ""} bg-gray-50/70 dark:bg-gray-900 rounded py-1 px-2`}
                          onClick={() => canEdit && setEditingField("dueDate")}
                        >
                          {currentMilestone.due_date !== null ? (
                            formatDate(currentMilestone.due_date ?? "")
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
                          {formatDate(currentMilestone.start_date)}
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
                {isOpen && daysRemaining !== null && (
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
                        {daysRemaining} day{daysRemaining === 1 ? "" : "s"} left
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
                      {getTimeAgo(currentMilestone.created_at ?? "")}
                    </p>
                    {currentMilestone.updated_at && (
                      <p className="text-xs text-muted-foreground">
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                          Updated:
                        </span>{" "}
                        {getTimeAgo(currentMilestone.updated_at)}
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
