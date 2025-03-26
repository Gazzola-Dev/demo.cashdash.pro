"use client";

import ProjectIconSelect from "@/components/dashboard/ProjectIconSelect";
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
import { Textarea } from "@/components/ui/textarea";
import { useUpdateProject } from "@/hooks/app.hooks";
import useProjectRole from "@/hooks/member.hooks";
import { useCreateProject, useDeleteProject } from "@/hooks/project.hooks";
import { cn } from "@/lib/utils";
import { useAppData } from "@/stores/app.store";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { KeyboardEvent, useEffect, useState } from "react";

// Loading Skeleton Component
const ProjectCardSkeleton = () => {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Project</CardTitle>
        </div>
        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Only showing project name since it's visible when collapsed */}
        <div className="space-y-2">
          <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </CardContent>
    </Card>
  );
};

const ProjectCard = () => {
  const { project, isAdmin, user, profile } = useAppData();
  const { isProjectManager, canEdit } = useProjectRole();
  const router = useRouter();

  // Loading state determination
  const isLoading = !user || !profile || !!(user && !project);

  const [isOpen, setIsOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    prefix: project?.prefix || "",
    github_repo_url: project?.github_repo_url || "",
    icon_name: project?.icon_name || "Code2",
    icon_color_fg: project?.icon_color_fg || "#000000",
    icon_color_bg: project?.icon_color_bg || "#FFFFFF",
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { updateProject, isPending } = useUpdateProject();
  const { createProject, isPending: isCreating } = useCreateProject();
  const { deleteProject, isPending: isDeleting } = useDeleteProject();

  // Update formData when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        prefix: project.prefix || "",
        github_repo_url: project.github_repo_url || "",
        icon_name: project.icon_name || "Code2",
        icon_color_fg: project.icon_color_fg || "#000000",
        icon_color_bg: project.icon_color_bg || "#FFFFFF",
      });
    }
  }, [project]);

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
    if (
      !project ||
      (!canEdit && fieldName !== "description" && fieldName !== "name")
    )
      return;

    // Only update if the field has changed
    let updates: Record<string, any> = {};
    let hasChanged = false;

    if (fieldName === "name" && formData.name !== project.name) {
      updates.name = formData.name;
      hasChanged = true;
    } else if (
      fieldName === "description" &&
      formData.description !== project.description
    ) {
      updates.description = formData.description;
      hasChanged = true;
    } else if (fieldName === "prefix" && formData.prefix !== project.prefix) {
      updates.prefix = formData.prefix;
      hasChanged = true;
    } else if (
      fieldName === "github_repo_url" &&
      formData.github_repo_url !== project.github_repo_url
    ) {
      updates.github_repo_url = formData.github_repo_url;
      hasChanged = true;
    } else if (
      fieldName === "icon_name" &&
      formData.icon_name !== project.icon_name
    ) {
      updates.icon_name = formData.icon_name;
      hasChanged = true;
    } else if (
      fieldName === "icon_color_fg" &&
      formData.icon_color_fg !== project.icon_color_fg
    ) {
      updates.icon_color_fg = formData.icon_color_fg;
      hasChanged = true;
    } else if (
      fieldName === "icon_color_bg" &&
      formData.icon_color_bg !== project.icon_color_bg
    ) {
      updates.icon_color_bg = formData.icon_color_bg;
      hasChanged = true;
    }

    if (hasChanged) {
      updateProject(project.id, updates);
    }

    setEditingField(null);
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    fieldName: string,
  ) => {
    if (e.key === "Enter" && fieldName !== "description") {
      e.preventDefault();
      handleSaveField(fieldName);
    } else if (e.key === "Escape") {
      setEditingField(null);
      // Reset form data to current project values
      if (project) {
        if (fieldName === "name") {
          setFormData(prev => ({
            ...prev,
            name: project.name || "",
          }));
        } else if (fieldName === "description") {
          setFormData(prev => ({
            ...prev,
            description: project.description || "",
          }));
        } else if (fieldName === "prefix") {
          setFormData(prev => ({
            ...prev,
            prefix: project.prefix || "",
          }));
        } else if (fieldName === "github_repo_url") {
          setFormData(prev => ({
            ...prev,
            github_repo_url: project.github_repo_url || "",
          }));
        } else if (fieldName === "icon_name") {
          setFormData(prev => ({
            ...prev,
            icon_name: project.icon_name || "",
          }));
        } else if (fieldName === "icon_color_fg") {
          setFormData(prev => ({
            ...prev,
            icon_color_fg: project.icon_color_fg || "",
          }));
        } else if (fieldName === "icon_color_bg") {
          setFormData(prev => ({
            ...prev,
            icon_color_bg: project.icon_color_bg || "",
          }));
        }
      }
    }
  };

  const handleCreateProject = () => {
    setIsCreateDialogOpen(false);
    createProject();
  };

  const handleDeleteProject = () => {
    if (!project) return;
    setIsDeleteDialogOpen(false);
    deleteProject(project.id);
  };

  const handleBlur = (fieldName: string) => {
    handleSaveField(fieldName);
  };

  if (isLoading) {
    return (
      <div className="h-full w-full md:w-1/2">
        <ProjectCardSkeleton />
      </div>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>No project selected</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="h-full w-full"
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Project</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && isOpen && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateDialogOpen(true)}
                  disabled={isCreating}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
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
                    Project Details <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label
              className="text-sm font-bold text-gray-500 dark:text-gray-400"
              htmlFor="name"
            >
              Project Name
            </label>
            {canEdit && editingField === "name" ? (
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={() => handleBlur("name")}
                onKeyDown={e => handleKeyDown(e, "name")}
                className="h-8"
                autoFocus
                disabled={isPending}
              />
            ) : (
              <p
                className={cn(
                  "text-sm bg-gray-50/50 dark:bg-gray-900 rounded py-1 px-2",
                  canEdit && "cursor-text",
                )}
                onClick={() => canEdit && setEditingField("name")}
              >
                {project?.name}
              </p>
            )}
          </div>

          {!isOpen ? null : (
            <>
              <div className="space-y-2">
                <label
                  className="text-sm font-bold text-gray-500 dark:text-gray-400"
                  htmlFor="description"
                >
                  Description
                </label>
                {canEdit && editingField === "description" ? (
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    onBlur={() => handleBlur("description")}
                    onKeyDown={e => handleKeyDown(e, "description")}
                    placeholder="Project description"
                    rows={4}
                    autoFocus
                    disabled={isPending}
                  />
                ) : (
                  <p
                    className={cn(
                      "text-sm bg-gray-50/50 dark:bg-gray-900 rounded py-1 px-2",
                      canEdit && "cursor-text",
                    )}
                    onClick={() => canEdit && setEditingField("description")}
                  >
                    {project?.description || (
                      <span className="text-gray-500 italic">
                        No description provided
                      </span>
                    )}
                  </p>
                )}
              </div>

              {isAdmin && <ProjectIconSelect />}

              {isAdmin && (
                <div className="space-y-2">
                  <label
                    className="text-sm font-bold text-gray-500 dark:text-gray-400"
                    htmlFor="prefix"
                  >
                    Prefix
                  </label>
                  {editingField === "prefix" ? (
                    <Input
                      id="prefix"
                      name="prefix"
                      value={formData.prefix}
                      onChange={handleChange}
                      onBlur={() => handleBlur("prefix")}
                      onKeyDown={e => handleKeyDown(e, "prefix")}
                      className="h-8"
                      autoFocus
                      disabled={isPending}
                    />
                  ) : (
                    <p
                      className={cn(
                        "text-sm bg-gray-50/50 dark:bg-gray-900 rounded py-1 px-2",
                        isAdmin && "cursor-text",
                      )}
                      onClick={() => isAdmin && setEditingField("prefix")}
                    >
                      {project?.prefix || (
                        <span className="text-gray-500 italic">No prefix</span>
                      )}
                    </p>
                  )}
                </div>
              )}

              {isAdmin && (
                <div className="space-y-2">
                  <label
                    className="text-sm font-bold text-gray-500 dark:text-gray-400"
                    htmlFor="github_repo_url"
                  >
                    GitHub Repository URL
                  </label>
                  {editingField === "github_repo_url" ? (
                    <Input
                      id="github_repo_url"
                      name="github_repo_url"
                      value={formData.github_repo_url || ""}
                      onChange={handleChange}
                      onBlur={() => handleBlur("github_repo_url")}
                      onKeyDown={e => handleKeyDown(e, "github_repo_url")}
                      className="h-8"
                      autoFocus
                      disabled={isPending}
                    />
                  ) : (
                    <p
                      className={cn(
                        "text-sm bg-gray-50/50 dark:bg-gray-900 rounded py-1 px-2",
                        isAdmin && "cursor-text",
                      )}
                      onClick={() =>
                        isAdmin && setEditingField("github_repo_url")
                      }
                    >
                      {project?.github_repo_url || (
                        <span className="text-gray-500 italic">
                          No GitHub repository linked
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
          {isOpen && isAdmin && (
            <div className="pt-2 space-y-1">
              <p className="text-xs text-muted-foreground">
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                  Created:
                </span>{" "}
                {project?.created_at &&
                  new Date(project?.created_at).toLocaleDateString()}
              </p>
              {project?.updated_at && (
                <p className="text-xs text-muted-foreground">
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                    Updated:{" "}
                  </span>
                  {new Date(project?.updated_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Adding Project */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              This will create a new project with default settings. You can
              customize it after creation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Deleting Project */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot
              be undone and will remove all tasks, milestones, and other data
              associated with this project.
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
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Collapsible>
  );
};

export default ProjectCard;
