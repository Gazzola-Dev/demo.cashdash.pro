import ActionButton from "@/components/shared/ActionButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGetProjectSlug } from "@/hooks/project.hooks";
import { useIsAdmin } from "@/hooks/user.hooks";
import { ProjectWithDetails } from "@/types/project.types";
import { LoaderCircle, Save, TerminalIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import ProjectMemberList from "./ProjectMemberList";

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
  const isAdmin = useIsAdmin();
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
  const [debouncedName] = useDebounce(formData.name, 500);
  const { mutate: getProjectSlug, isPending: isSlugPending } =
    useGetProjectSlug();

  useEffect(() => {
    if (!isNew && projectData) {
      setFormData({});
      setHasChanges(false);
    }
  }, [isNew, projectData]);

  useEffect(() => {
    if (debouncedName && isAdmin) {
      getProjectSlug(debouncedName, {
        onSuccess: slug => {
          if (slug) setFormData(prev => ({ ...prev, slug }));
        },
      });
    }
  }, [debouncedName, getProjectSlug, isAdmin]);

  const handleChange = (
    field: keyof ProjectWithDetails,
    value: string | ProjectWithDetails["status"],
  ) => {
    if (!isAdmin) return;

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
  const renderField = (
    label: string,
    value: string | null | undefined,
    field: keyof ProjectWithDetails,
    placeholder?: string,
  ) => {
    if (isAdmin) {
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
    }
    return (
      <div className="p-2 bg-muted rounded-md">
        {value || `No ${label.toLowerCase()} set`}
      </div>
    );
  };

  const renderTextArea = (
    label: string,
    value: string | null | undefined,
    field: keyof ProjectWithDetails,
  ) => {
    if (isAdmin) {
      return (
        <Textarea
          value={value || ""}
          onChange={e => handleChange(field, e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="min-h-[100px]"
        />
      );
    }
    return (
      <div className="p-2 bg-muted rounded-md min-h-[100px] whitespace-pre-line">
        {value || `No ${label.toLowerCase()} set`}
      </div>
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
                disabled={!isValid || isPending || !isAdmin}
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
              {!isNew && hasChanges && isAdmin && (
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
                {renderField(
                  "Project Name",
                  displayData?.name,
                  "name",
                  "My Project",
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Project Slug</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-muted rounded-md dark:text-gray-200 text-gray-900 italic relative">
                    <span className="py-2 px-3 bg-gray-50 dark:bg-gray-900 rounded-md flex items-center tracking-wide">
                      <span className="px-1 text-gray-500 tracking-normal">
                        cashdash.pro/
                      </span>{" "}
                      {isSlugPending ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : !debouncedName ? (
                        "my-project"
                      ) : (
                        displayData?.slug || "my-project"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Project Prefix</label>
                {renderField("Project Prefix", displayData?.prefix, "prefix")}
                <p className="text-xs text-muted-foreground">
                  Used for task IDs (e.g.,{" "}
                  <span className="font-semibold italic">
                    {displayData?.prefix || "MYPRJ"}
                  </span>
                  -123)
                </p>
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

export default ProjectPage;
