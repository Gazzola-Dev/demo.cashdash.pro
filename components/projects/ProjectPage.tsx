import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import {
  PROJECT_STATUS_OPTIONS,
  ProjectWithDetails,
} from "@/types/project.types";
import { TerminalIcon } from "lucide-react";
import { useCallback, useState } from "react";

interface ProjectPageProps {
  projectData?: ProjectWithDetails | null;
  onUpdate?: (updates: Partial<ProjectWithDetails>) => void;
  onCreate?: (project: Partial<ProjectWithDetails>) => void;
  isNew?: boolean;
}

export function ProjectPage({
  projectData,
  onUpdate,
  onCreate,
  isNew = false,
}: ProjectPageProps) {
  // Initialize state with either project data or empty values for new project
  const [name, setName] = useState(projectData?.name || "");
  const [description, setDescription] = useState(
    projectData?.description || "",
  );
  const [status, setStatus] = useState(projectData?.status || "active");
  const [prefix, setPrefix] = useState(projectData?.prefix || "");
  const [githubRepoUrl, setGithubRepoUrl] = useState(
    projectData?.github_repo_url || "",
  );
  const [githubOwner, setGithubOwner] = useState(
    projectData?.github_owner || "",
  );
  const [githubRepo, setGithubRepo] = useState(projectData?.github_repo || "");
  const [slug, setSlug] = useState(projectData?.slug || "");

  // Handle updating for existing project
  const handleUpdate = useCallback(
    (updates: Partial<ProjectWithDetails>) => {
      if (onUpdate) {
        onUpdate(updates);
      }
    },
    [onUpdate],
  );

  // Handle creating new project
  const handleCreate = useCallback(() => {
    if (onCreate) {
      onCreate({
        name,
        description,
        status: status as ProjectWithDetails["status"],
        prefix,
        github_repo_url: githubRepoUrl,
        github_owner: githubOwner,
        github_repo: githubRepo,
        slug,
      });
    }
  }, [
    name,
    description,
    status,
    prefix,
    githubRepoUrl,
    githubOwner,
    githubRepo,
    slug,
    onCreate,
  ]);

  // Check if all required fields are filled for new project
  const isValid = name && prefix && slug;

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
                disabled={!isValid}
              >
                Publish Project
              </Button>
            </div>
          </Alert>
        </div>
      )}

      <div className="flex gap-6">
        <div className="flex-1 space-y-6">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (!isNew) {
                      handleUpdate({ name: e.target.value });
                    }
                  }}
                  placeholder="My Awesome Project"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description || ""}
                  onChange={e => {
                    setDescription(e.target.value);
                    if (!isNew) {
                      handleUpdate({ description: e.target.value });
                    }
                  }}
                  placeholder="Project description..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Project Status</label>
                <Select
                  value={status}
                  onValueChange={value => {
                    setStatus(value as ProjectWithDetails["status"]);
                    if (!isNew) {
                      handleUpdate({
                        status: value as ProjectWithDetails["status"],
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUS_OPTIONS.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Project Prefix</label>
                <Input
                  value={prefix}
                  onChange={e => {
                    setPrefix(e.target.value.toUpperCase());
                    if (!isNew) {
                      handleUpdate({ prefix: e.target.value.toUpperCase() });
                    }
                  }}
                  placeholder="PRJ"
                  maxLength={5}
                />
                <p className="text-xs text-gray-500">
                  Used for task IDs (e.g., PRJ-123)
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Project Slug</label>
                <Input
                  value={slug}
                  onChange={e => {
                    setSlug(e.target.value.toLowerCase());
                    if (!isNew) {
                      handleUpdate({ slug: e.target.value.toLowerCase() });
                    }
                  }}
                  placeholder="my-awesome-project"
                />
                <p className="text-xs text-gray-500">
                  Used in URLs (e.g., /my-awesome-project)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* GitHub Integration Card */}
          <Card>
            <CardHeader>
              <CardTitle>GitHub Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  GitHub Repository URL
                </label>
                <Input
                  value={githubRepoUrl}
                  onChange={e => {
                    setGithubRepoUrl(e.target.value);
                    if (!isNew) {
                      handleUpdate({ github_repo_url: e.target.value });
                    }
                  }}
                  placeholder="https://github.com/owner/repo"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">GitHub Owner</label>
                <Input
                  value={githubOwner}
                  onChange={e => {
                    setGithubOwner(e.target.value);
                    if (!isNew) {
                      handleUpdate({ github_owner: e.target.value });
                    }
                  }}
                  placeholder="owner"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">GitHub Repository</label>
                <Input
                  value={githubRepo}
                  onChange={e => {
                    setGithubRepo(e.target.value);
                    if (!isNew) {
                      handleUpdate({ github_repo: e.target.value });
                    }
                  }}
                  placeholder="repository-name"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-80 space-y-6">
          {/* Team Members Card */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectData?.project_members?.map((member, i) => (
                  <div key={member.id + i} className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={member.profile?.avatar_url || ""}
                        alt={member.profile?.display_name || "Member"}
                      />
                      <AvatarFallback>
                        {member.profile?.display_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {member.profile?.display_name}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {member.role}
                      </div>
                    </div>
                  </div>
                ))}
                {(!projectData?.project_members ||
                  projectData.project_members.length === 0) && (
                  <div className="text-sm text-gray-500">
                    No team members yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Project Metrics Card */}
          <Card>
            <CardHeader>
              <CardTitle>Project Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectData?.project_metrics?.map((metric, i) => (
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
                {(!projectData?.project_metrics ||
                  projectData.project_metrics.length === 0) && (
                  <div className="text-sm text-gray-500">
                    No metrics available yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ProjectPage;
