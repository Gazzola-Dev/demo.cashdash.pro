import ActionButton from "@/components/shared/ActionButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useDialogQueue } from "@/hooks/useDialogQueue";
import { cn } from "@/lib/utils";
import { ProjectWithDetails } from "@/types/project.types";
import { LoaderCircle, Save, TerminalIcon, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import ProjectMemberList from "./ProjectMemberList";

// TODO: fix stale title and description on new page after creating

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
  const router = useRouter();
  const { toast } = useToast();
  const { dialog } = useDialogQueue();
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

  const nameIsChanged = projectData?.name !== formData.name;

  const [hasChanges, setHasChanges] = useState(false);
  const [debouncedName] = useDebounce(formData.name, 500);

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

  const handleDelete = () => {
    if (!projectData?.id) return;
    dialog({
      title: "Delete Project",
      description:
        "Are you sure you want to delete this project? This action cannot be undone.",
      variant: "destructive",
      onConfirm: () => {},
    });
  };

  const displayData = isNew ? formData : { ...projectData, ...formData };

  const displayProjectSlug =
    !nameIsChanged && !isNew
      ? projectData?.slug
      : displayData?.slug || "my-project";

  const isValid = Boolean(
    displayData?.name && displayData?.prefix && displayData?.slug,
  );
  const renderField = (
    label: string,
    value: string | null | undefined,
    field: keyof ProjectWithDetails,
    placeholder?: string,
  ) => {
    return (
      <Input
        value={value || ""}
        onChange={e => {
          if (field === "prefix") {
            const lettersOnly = e.target.value.replace(/[^A-Za-z]/g, "");
            handleChange(field, lettersOnly.toUpperCase());
          } else {
            handleChange(field, e.target.value);
          }
        }}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
      />
    );
  };

  const renderTextArea = (
    label: string,
    value: string | null | undefined,
    field: keyof ProjectWithDetails,
  ) => {
    return (
      <Textarea
        value={value || ""}
        onChange={e => handleChange(field, e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`}
        className="min-h-[100px]"
      />
    );
  };

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
              <ActionButton
                variant="outline"
                size="sm"
                className="ml-4 border-amber-500 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                onClick={handleCreate}
                disabled={!isValid || isPending}
              >
                Publish Project
              </ActionButton>
            </div>
          </Alert>
        </div>
      )}

      <div className="flex gap-6">
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Project Information</CardTitle>
              <div className="flex gap-2">
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
                          className={cn(
                            "scale-0 transition-all duration-500 ease-out",
                            isPending && "scale-100",
                          )}
                        >
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    </div>
                  </Button>
                )}
                {!isNew && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Project
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                {renderField(
                  "Project Name",
                  displayData?.name,
                  "name",
                  "My Project",
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Project Prefix</label>
                {renderField("Project Prefix", displayData?.prefix, "prefix")}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Example URL</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-muted rounded-md dark:text-gray-200 text-gray-900 italic relative flex items-center px-2 py-1 ">
                    <span className="px-2 py-0.5 text-gray-600 font-semibold bg-gray-100 rounded">
                      cashdash.pro /
                    </span>
                    {!displayData?.slug && !isPending ? (
                      "..."
                    ) : isPending ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help px-1.5 py-0.5 border-gray-100 hover:border-blue-900 hover:rounded hover:border-dashed border mx-0.5 not-italic">
                                {displayProjectSlug}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="pr-0">
                              <div className="py-1 px-0.5 font-bold text-sm">
                                Your project can be accessed at:
                                <span className="mx-2 px-1.5 py-1 bg-background text-gray-800 rounded font-bold">
                                  cashdash.pro/{displayProjectSlug}
                                </span>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <span className="px-2 text-gray-600 bg-gray-100 font-semibold rounded">
                          /
                        </span>
                        {displayData.prefix && (
                          <>
                            {" "}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help px-1.5 pr-0.5 py-0.5 border-gray-100 hover:border-blue-900 hover:rounded hover:border-dashed border mx-0.5 not-italic">
                                    {`${displayData.prefix}`}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="pr-0">
                                  <div className="py-1 px-0.5 font-bold text-sm ">
                                    Each task can be accessed at:
                                    <span className="mx-2 px-1.5 py-1 bg-background text-gray-800 rounded font-bold">
                                      cashdash.pro/{displayProjectSlug}/
                                      {displayData.prefix}
                                    </span>
                                    +
                                    <span className="mx-2 px-1.5 py-1 bg-background text-gray-800 rounded font-bold">
                                      Task number
                                    </span>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <span className="px-2 text-gray-600 font-semibold bg-gray-100 rounded">
                              123
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                {renderTextArea(
                  "Description",
                  displayData?.description,
                  "description",
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-80 space-y-6">
          <ProjectMemberList isDraft={isNew} />
        </div>
      </div>
    </div>
  );
}
