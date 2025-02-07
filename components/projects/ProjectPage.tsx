import ProjectMemberList from "@/components/projects/ProjectMemberList";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ProjectWithDetails } from "@/types/project.types";
import { LoaderCircle, Save, TerminalIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface ProjectPageProps {
  projectData?: ProjectWithDetails | null;
  isNew?: boolean;
  onCreate?: (project: Partial<ProjectWithDetails>) => void;
  onUpdate?: (updates: Partial<ProjectWithDetails>) => void;
  isPending?: boolean;
}

export function ProjectPage({
  projectData,
  isNew = false,
  onCreate,
  onUpdate,
  isPending = false,
}: ProjectPageProps) {
  const [formData, setFormData] = useState<Partial<ProjectWithDetails>>(
    isNew
      ? {
          name: "",
          description: "",
          status: "active",
          prefix: "",
          github_repo_url: "",
          github_owner: "",
          github_repo: "",
          slug: "",
        }
      : {},
  );

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!isNew && projectData) {
      setFormData({});
      setHasChanges(false);
    }
  }, [isNew, projectData]);

  const handleChange = (
    field: keyof ProjectWithDetails,
    value: string | ProjectWithDetails["status"],
  ) => {
    if (isNew) {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      setHasChanges(true);
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCreate = () => {
    if (onCreate && isValid) {
      onCreate(formData);
    }
  };

  const handleSave = () => {
    if (onUpdate && formData && Object.keys(formData).length > 0) {
      onUpdate(formData);
      setHasChanges(false);
    }
  };

  const displayData = isNew ? formData : { ...projectData, ...formData };

  const isValid = Boolean(
    displayData?.name && displayData?.prefix && displayData?.slug,
  );

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {isNew && (
        <div className="sticky top-0 z-50 mb-4">
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
            <TerminalIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">
              Draft Mode
            </AlertTitle>
            <div className="flex items-center justify-between w-full">
              <AlertDescription className="text-amber-600 dark:text-amber-400">
                This project is currently in draft mode and is only visible to
                you.
              </AlertDescription>
              <Button
                variant="outline"
                size="sm"
                className="ml-4 border-amber-500 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                onClick={handleCreate}
                disabled={!isValid || isPending}
              >
                <div className="relative flex items-center">
                  Publish Project
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={`scale-0 transition-all duration-500 ease-out ${isPending ? "scale-100" : ""}`}
                    >
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </Alert>
        </div>
      )}

      <div className="flex gap-6">
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Project Information</CardTitle>
              {!isNew && hasChanges && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isPending}
                >
                  <div className="relative flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className={`scale-0 transition-all duration-500 ease-out ${isPending ? "scale-100" : ""}`}
                      >
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  </div>
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  value={displayData?.name || ""}
                  onChange={e => handleChange("name", e.target.value)}
                  placeholder="My Awesome Project"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={displayData?.description || ""}
                  onChange={e => handleChange("description", e.target.value)}
                  placeholder="Project description..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Project Status</label>
                <Select
                  value={displayData?.status || "active"}
                  onValueChange={value => handleChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Project Prefix</label>
                <Input
                  value={displayData?.prefix || ""}
                  onChange={e =>
                    handleChange("prefix", e.target.value.toUpperCase())
                  }
                  placeholder="PRJ"
                  maxLength={5}
                />
                <p className="text-xs text-muted-foreground">
                  Used for task IDs (e.g., PRJ-123)
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Project Slug</label>
                <Input
                  value={displayData?.slug || ""}
                  onChange={e =>
                    handleChange("slug", e.target.value.toLowerCase())
                  }
                  placeholder="my-awesome-project"
                />
                <p className="text-xs text-muted-foreground">
                  Used in URLs (e.g., /my-awesome-project)
                </p>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">GitHub Integration</h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Repository URL</label>
                  <Input
                    value={displayData?.github_repo_url || ""}
                    onChange={e =>
                      handleChange("github_repo_url", e.target.value)
                    }
                    placeholder="https://github.com/owner/repo"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Repository Owner
                  </label>
                  <Input
                    value={displayData?.github_owner || ""}
                    onChange={e => handleChange("github_owner", e.target.value)}
                    placeholder="owner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Repository Name</label>
                  <Input
                    value={displayData?.github_repo || ""}
                    onChange={e => handleChange("github_repo", e.target.value)}
                    placeholder="repository-name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-80 space-y-6">
          <ProjectMemberList isDraft={isNew} />

          {!isNew &&
            projectData?.project_metrics &&
            projectData.project_metrics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Project Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projectData.project_metrics.map((metric, i) => (
                      <div key={metric.id + i} className="space-y-2">
                        <div className="text-sm font-medium">
                          {new Date(metric.date).toLocaleDateString()}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Velocity</div>
                          <div>{metric.velocity}</div>
                          <div>Completion</div>
                          <div>{metric.completion_percentage}%</div>
                          <div>Burn Rate</div>
                          <div>${(metric?.burn_rate_cents || 0) / 100}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}

export default ProjectPage;
