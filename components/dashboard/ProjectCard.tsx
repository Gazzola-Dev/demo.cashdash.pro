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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateProject } from "@/hooks/app.hooks";
import useAppData from "@/hooks/useAppData";
import { ChevronDown, ChevronUp } from "lucide-react";
import { KeyboardEvent, useEffect, useState } from "react";

const ProjectCard = () => {
  const { project, isAdmin } = useAppData();
  const [isOpen, setIsOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    prefix: project?.prefix || "",
    github_repo_url: project?.github_repo_url || "",
  });

  const { updateProject, isPending } = useUpdateProject();

  // Update formData when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        prefix: project.prefix || "",
        github_repo_url: project.github_repo_url || "",
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
    if (!project) return;

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
        }
      }
    }
  };

  const handleBlur = (fieldName: string) => {
    handleSaveField(fieldName);
  };

  if (!project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
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
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              {isOpen ? "Project information" : ""}
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
                  Project details <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-bold text-gray-600" htmlFor="name">
              Project Name
            </Label>
            {isAdmin && editingField === "name" ? (
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
                className="text-sm cursor-text bg-gray-50/70 rounded py-1 px-2"
                onClick={() => isAdmin && setEditingField("name")}
              >
                {project.name}
              </p>
            )}
          </div>

          {!isOpen ? null : (
            <>
              <div className="space-y-2">
                <Label
                  className="text-sm font-bold text-gray-600"
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
                    placeholder="Project description"
                    rows={4}
                    autoFocus
                    disabled={isPending}
                  />
                ) : (
                  <p
                    className="text-sm cursor-text bg-gray-50/70 rounded py-1 px-2"
                    onClick={() => isAdmin && setEditingField("description")}
                  >
                    {project.description || (
                      <span className="text-gray-500 italic">
                        No description provided
                      </span>
                    )}
                  </p>
                )}
              </div>

              {isAdmin && (
                <>
                  {/* <div className="space-y-2">
                    <Label htmlFor="prefix">Project Prefix</Label>
                    {editingField === "prefix" ? (
                      <Input
                        id="prefix"
                        name="prefix"
                        value={formData.prefix}
                        onChange={handleChange}
                        onBlur={() => handleBlur("prefix")}
                        onKeyDown={e => handleKeyDown(e, "prefix")}
                        placeholder="E.g., PRJ"
                        autoFocus
                        disabled={isPending}
                      />
                    ) : (
                      <p
                        className="text-sm font-medium cursor-text"
                        onClick={() => setEditingField("prefix")}
                      >
                        {project.prefix}
                      </p>
                    )}
                  </div> */}

                  {/* <div className="space-y-2">
                    <Label htmlFor="github_repo_url">GitHub Repository</Label>
                    {editingField === "github_repo_url" ? (
                      <Input
                        id="github_repo_url"
                        name="github_repo_url"
                        value={formData.github_repo_url || ""}
                        onChange={handleChange}
                        onBlur={() => handleBlur("github_repo_url")}
                        onKeyDown={e => handleKeyDown(e, "github_repo_url")}
                        placeholder="https://github.com/username/repo"
                        autoFocus
                        disabled={isPending}
                      />
                    ) : (
                      <p
                        className="text-sm break-all cursor-text"
                        onClick={() => setEditingField("github_repo_url")}
                      >
                        {project.github_repo_url ? (
                          <a
                            href={project.github_repo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={e => e.stopPropagation()}
                          >
                            {project.github_repo_url}
                          </a>
                        ) : (
                          <span className="text-gray-500 italic">
                            Not connected
                          </span>
                        )}
                      </p>
                    )}
                  </div> */}
                </>
              )}
            </>
          )}

          <div className="pt-2 space-y-1">
            <p className="text-xs text-muted-foreground">
              <span className="text-sm font-bold text-gray-600">
                Created on:
              </span>
              {new Date(project.created_at).toLocaleDateString()}
            </p>
            {project.updated_at && (
              <p className="text-xs text-muted-foreground">
                <span className="text-sm font-bold text-gray-600">
                  Last updated:{" "}
                </span>
                {new Date(project.updated_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Collapsible>
  );
};

export default ProjectCard;
