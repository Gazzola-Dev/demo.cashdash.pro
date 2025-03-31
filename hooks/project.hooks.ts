import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/stores/app.store";
import { ProjectWithDetails } from "@/types/app.types";
import { Tables } from "@/types/database.types";
import { useCallback, useEffect, useState } from "react";

type Project = Tables<"projects">;

/**
 * Hook for getting a project by slug
 */
export const useGetProjectBySlug = () => {
  const { project, setProject } = useAppData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProjectBySlug = useCallback(
    (projectSlug: string) => {
      if (!projectSlug) {
        setProject(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check if we already have the project loaded
        if (project && project.slug === projectSlug) {
          setIsLoading(false);
          return;
        }

        // In a real implementation, you would fetch the project from an API
        // For now, we'll create a mock project based on the slug
        const projectData: Partial<ProjectWithDetails> = {
          id: `project-${projectSlug}`,
          name:
            projectSlug.charAt(0).toUpperCase() +
            projectSlug.slice(1).replace(/-/g, " "),
          slug: projectSlug,
          description: `Description for ${projectSlug}`,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          prefix: projectSlug.substring(0, 3).toUpperCase(),
          project_members: [],
          project_invitations: [],
        };

        // This will update both project and the projects collection thanks to our enhanced store
        setProject(projectData);
      } catch (err) {
        setError("Failed to load project");
        console.error("Error loading project:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [project, setProject],
  );

  return {
    data: project,
    isLoading,
    error,
    getProjectBySlug,
  };
};

/**
 * Hook to create a project
 */
export const useCreateProject = () => {
  const { toast } = useToast();
  const { projects, setProjects, setProject } = useAppData();
  const [isPending, setIsPending] = useState(false);

  const createProject = useCallback(
    (projectData?: Partial<Project>) => {
      if (!projectData) throw new Error("Project data is required");
      setIsPending(true);

      try {
        // In a real implementation, you would call an API to create the project
        const newProject: Partial<Project> = {
          id: `project-${Date.now()}`,
          name: projectData.name || "New Project",
          description: projectData.description || "",
          slug:
            projectData.slug ||
            projectData.name?.toLowerCase().replace(/\s+/g, "-") ||
            `project-${Date.now()}`,
          prefix:
            projectData.prefix ||
            projectData.name?.substring(0, 3).toUpperCase() ||
            "PRJ",
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Update projects in state
        setProjects([...projects, newProject]);

        // Also set this as the current project
        setProject(newProject);

        toast({
          title: "Project created",
          description: "New project has been created successfully.",
        });

        return newProject;
      } catch (error) {
        console.error("Error creating project:", error);
        toast({
          title: "Creation failed",
          description: "Failed to create project. Please try again.",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [projects, setProjects, setProject, toast],
  );

  return {
    createProject,
    isPending,
  };
};

/**
 * Hook to update a project
 */
export const useUpdateProject = () => {
  const { toast } = useToast();
  const { project, setProject } = useAppData();
  const [isPending, setIsPending] = useState(false);

  const updateProject = useCallback(
    (projectId: string, updates: Partial<Project>) => {
      if (!projectId) return null;

      setIsPending(true);
      try {
        // In a real implementation, you would call an API here
        const updatedProject = {
          ...(project?.id === projectId ? project : {}),
          ...updates,
          id: projectId,
          updated_at: new Date().toISOString(),
        };

        // Update the project in state - this will also update it in the projects array
        // thanks to our enhanced store
        setProject(updatedProject);

        toast({
          title: "Project updated",
          description: "Project has been successfully updated.",
        });

        return updatedProject;
      } catch (error) {
        console.error("Error updating project:", error);
        toast({
          title: "Update failed",
          description: "Failed to update project. Please try again.",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [project, setProject, toast],
  );

  return {
    updateProject,
    isPending,
  };
};

/**
 * Hook to delete a project
 */
export const useDeleteProject = () => {
  const { toast } = useToast();
  const { projects, setProjects, project, setProject } = useAppData();
  const [isPending, setIsPending] = useState(false);

  const deleteProject = useCallback(
    (projectId: string) => {
      if (!projectId) return false;

      setIsPending(true);
      try {
        // In a real implementation, you would call an API here
        // Remove project from projects list
        const updatedProjects = projects.filter(p => p.id !== projectId);
        setProjects(updatedProjects);

        // If the deleted project is the current project, clear it
        if (project?.id === projectId) {
          setProject(null);
        }

        toast({
          title: "Project deleted",
          description: "Project has been successfully deleted.",
        });

        return true;
      } catch (error) {
        console.error("Error deleting project:", error);
        toast({
          title: "Deletion failed",
          description: "Failed to delete project. Please try again.",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [projects, setProjects, project, setProject, toast],
  );

  return {
    deleteProject,
    isPending,
  };
};

/**
 * Hook for project details form
 */
export function useProjectDetailsForm() {
  const { project, isAdmin } = useAppData();
  const { updateProject } = useUpdateProject();
  const { isProjectManager } = useProjectRole();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const canEdit = isAdmin || isProjectManager;

  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    status: project?.status || "active",
    prefix: project?.prefix || "",
  });

  // Update form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        status: project.status || "active",
        prefix: project.prefix || "",
      });
    }
  }, [project]);

  const handleSaveField = useCallback(
    (field: string) => {
      if (!project || !canEdit) return;

      setIsPending(true);
      try {
        const updates: Partial<Project> = {
          [field]: formData[field as keyof typeof formData],
        };

        updateProject(project.id as string, updates);
        setEditingField(null);
      } catch (error) {
        console.error(`Error saving ${field}:`, error);
      } finally {
        setIsPending(false);
      }
    },
    [project, canEdit, formData, updateProject],
  );

  const handleChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  return {
    editingField,
    setEditingField,
    formData,
    canEdit,
    isPending,
    handleSaveField,
    handleChange,
  };
}

/**
 * Hook for project role
 */
/**
 * Hook for project role - properly handles all variations of PM roles
 */
export function useProjectRole() {
  const { project, user, isAdmin } = useAppData();

  // This function checks if a role string indicates project management privileges
  const isPMRole = (role: string): boolean => {
    // Normalize the role string to lowercase for case-insensitive comparison
    const normalizedRole = role.toLowerCase();

    // Check against all possible PM role variations
    return ["owner", "admin", "pm", "project_manager", "project manager"].some(
      pmRole => normalizedRole.includes(pmRole),
    );
  };

  // Check if user is a project manager or admin in the project
  const isProjectManager =
    isAdmin ||
    (user &&
      project?.project_members?.some(
        member =>
          member.user_id === user.id &&
          (member.role ? isPMRole(member.role) : false),
      )) ||
    false;

  // User can edit if they are an admin or project manager
  const canEdit = isAdmin || isProjectManager;

  return {
    isProjectManager,
    isAdmin,
    canEdit,
  };
}

/**
 * Hook for project members
 */
export function useProjectMembers() {
  const { project, user, setProject } = useAppData();
  const { isProjectManager } = useProjectRole();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  // User's own member ID for self-actions
  const currentUserId = user?.id;

  // Check if current user is in the project
  const isUserInProject =
    project?.project_members?.some(
      member => member.user_id === currentUserId,
    ) || false;

  const addProjectMember = useCallback(
    (userId: string, role: string = "developer") => {
      if (!project || !isProjectManager) return;

      setIsPending(true);
      try {
        // Find user profile from existing data if available
        const userProfile = project.project_members?.find(
          member => member.user_id === userId,
        )?.profile;

        // Create new member
        const newMember = {
          id: `member-${Date.now()}`,
          user_id: userId,
          project_id: project.id,
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profile: userProfile || {
            id: userId,
            display_name: "Unknown User",
            email: "user@example.com",
            avatar_url: null,
          },
        };

        // Update project with new member - this will also update projects collection
        setProject({
          ...project,
          project_members: [...(project.project_members || []), newMember],
        });

        toast({
          title: "Member added",
          description: "New member has been added to the project.",
        });
      } catch (error) {
        console.error("Error adding project member:", error);
        toast({
          title: "Failed to add member",
          description:
            "There was an error adding the member. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsPending(false);
      }
    },
    [project, isProjectManager, setProject, toast],
  );

  const removeProjectMember = useCallback(
    (memberId: string) => {
      if (!project || !isProjectManager) return;

      setIsPending(true);
      try {
        // Update project members list
        const updatedMembers = (project.project_members || []).filter(
          member => member.id !== memberId,
        );

        // Update project with new members list - this will also update projects collection
        setProject({
          ...project,
          project_members: updatedMembers,
        });

        toast({
          title: "Member removed",
          description: "Member has been removed from the project.",
        });
      } catch (error) {
        console.error("Error removing project member:", error);
        toast({
          title: "Failed to remove member",
          description:
            "There was an error removing the member. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsPending(false);
      }
    },
    [project, isProjectManager, setProject, toast],
  );

  const updateMemberRole = useCallback(
    (memberId: string, newRole: string) => {
      if (!project || !isProjectManager) return;

      setIsPending(true);
      try {
        // Update member role
        const updatedMembers = (project.project_members || []).map(member =>
          member.id === memberId
            ? { ...member, role: newRole, updated_at: new Date().toISOString() }
            : member,
        );

        // Update project with new members list - this will also update projects collection
        setProject({
          ...project,
          project_members: updatedMembers,
        });

        toast({
          title: "Role updated",
          description: "Member role has been updated successfully.",
        });
      } catch (error) {
        console.error("Error updating member role:", error);
        toast({
          title: "Failed to update role",
          description:
            "There was an error updating the role. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsPending(false);
      }
    },
    [project, isProjectManager, setProject, toast],
  );

  return {
    project,
    isProjectManager,
    currentUserId,
    isUserInProject,
    isPending,
    addProjectMember,
    removeProjectMember,
    updateMemberRole,
  };
}

/**
 * Hook for project invitations
 */
export function useProjectInvitations() {
  const { project, user, setProjectInvitations } = useAppData();
  const { isProjectManager } = useProjectRole();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const inviteToProject = useCallback(
    (email: string, role: string = "developer") => {
      if (!project || !isProjectManager || !user) return;

      setIsPending(true);
      try {
        // Create new invitation
        const newInvitation = {
          id: `invitation-${Date.now()}`,
          project_id: project.id,
          email,
          role,
          invited_by: user.id,
          status: "pending" as Tables<"project_invitations">["status"],
          created_at: new Date().toISOString(),
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 7 days from now
        };

        // Get updated invitations
        const updatedInvitations = [
          ...(project.project_invitations || []),
          newInvitation,
        ];

        // Update project invitations - this will also update project and projects collection
        setProjectInvitations(updatedInvitations);

        toast({
          title: "Invitation sent",
          description: `An invitation has been sent to ${email}.`,
        });
      } catch (error) {
        console.error("Error sending invitation:", error);
        toast({
          title: "Failed to send invitation",
          description:
            "There was an error sending the invitation. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsPending(false);
      }
    },
    [project, isProjectManager, user, setProjectInvitations, toast],
  );

  const cancelInvitation = useCallback(
    (invitationId: string) => {
      if (!project || !isProjectManager) return;

      setIsPending(true);
      try {
        // Update invitations list
        const updatedInvitations = (project.project_invitations || []).filter(
          invitation => invitation.id !== invitationId,
        );

        // Update project invitations - this will also update project and projects collection
        setProjectInvitations(updatedInvitations);

        toast({
          title: "Invitation cancelled",
          description: "The invitation has been cancelled.",
        });
      } catch (error) {
        console.error("Error cancelling invitation:", error);
        toast({
          title: "Failed to cancel invitation",
          description:
            "There was an error cancelling the invitation. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsPending(false);
      }
    },
    [project, isProjectManager, setProjectInvitations, toast],
  );

  return {
    project,
    isProjectManager,
    isPending,
    inviteToProject,
    cancelInvitation,
  };
}
