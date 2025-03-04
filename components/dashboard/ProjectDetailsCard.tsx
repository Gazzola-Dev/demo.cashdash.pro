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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useAppData from "@/hooks/useAppData";
import { Edit2, Save } from "lucide-react";
import { useState } from "react";

const ProjectDetailsCard = () => {
  const { project, setProject, isAdmin } = useAppData();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    prefix: project?.prefix || "",
    github_repo_url: project?.github_repo_url || "",
  });

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
    if (project) {
      // In a real implementation, this would be an API call
      // For now, just update the local state
      setProject({
        ...project,
        name: formData.name,
        description: formData.description,
        prefix: formData.prefix,
        github_repo_url: formData.github_repo_url,
      });
    }
    setIsEditing(false);
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
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            {isEditing
              ? "Edit project information"
              : "View project information"}
          </CardDescription>
        </div>
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          >
            {isEditing ? (
              <Save className="h-4 w-4" />
            ) : (
              <Edit2 className="h-4 w-4" />
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Project Name</Label>
          {isEditing ? (
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          ) : (
            <p className="text-sm font-medium">{project.name}</p>
          )}
        </div>

        {/* <div className="space-y-2">
          <Label htmlFor="prefix">Project Prefix</Label>
          {isEditing ? (
            <Input
              id="prefix"
              name="prefix"
              value={formData.prefix}
              onChange={handleChange}
              placeholder="E.g., PRJ"
            />
          ) : (
            <p className="text-sm font-medium">{project.prefix}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="github_repo_url">GitHub Repository</Label>
          {isEditing ? (
            <Input
              id="github_repo_url"
              name="github_repo_url"
              value={formData.github_repo_url || ""}
              onChange={handleChange}
              placeholder="https://github.com/username/repo"
            />
          ) : (
            <p className="text-sm break-all">
              {project.github_repo_url ? (
                <a
                  href={project.github_repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {project.github_repo_url}
                </a>
              ) : (
                <span className="text-gray-500 italic">Not connected</span>
              )}
            </p>
          )}
        </div> */}

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          {isEditing ? (
            <Textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="Project description"
              rows={4}
            />
          ) : (
            <p className="text-sm">
              {project.description || (
                <span className="text-gray-500 italic">
                  No description provided
                </span>
              )}
            </p>
          )}
        </div>

        <div className="pt-2 space-y-1">
          <p className="text-xs text-muted-foreground">
            Created on: {new Date(project.created_at).toLocaleDateString()}
          </p>
          {project.updated_at && (
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(project.updated_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
      {isEditing && (
        <CardFooter className="flex justify-between pt-0">
          <Button
            variant="outline"
            onClick={() => {
              setFormData({
                name: project.name || "",
                description: project.description || "",
                prefix: project.prefix || "",
                github_repo_url: project.github_repo_url || "",
              });
              setIsEditing(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ProjectDetailsCard;
