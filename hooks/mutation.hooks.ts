// mutation.hooks.ts
import {
  createCommentAction,
  updateCommentAction,
} from "@/actions/comment.actions";
import {
  deleteInvitationAction,
  respondToInvitationAction,
} from "@/actions/invite.actions";
import { updateProfileAction } from "@/actions/profile.actions";
import {
  createProjectAction,
  deleteProjectAction,
  deleteProjectMemberAction,
  getProjectSlugAction,
  inviteMemberAction,
  updateProjectAction,
} from "@/actions/project.actions";
import {
  createSubtaskAction,
  createTaskAction,
  deleteSubtaskAction,
  deleteTaskAction,
  updateTaskAction,
} from "@/actions/task.actions";
import configuration from "@/configuration";
import useAppStore from "@/hooks/app.store";
import { useToast } from "@/hooks/use-toast";
import { conditionalLog } from "@/lib/log.utils";
import { CommentWithProfile } from "@/types/comment.types";
import { Tables, TablesUpdate } from "@/types/database.types";
import { ProfileWithDetails, UpdateProfileInput } from "@/types/profile.types";
import {
  InviteMemberInput,
  ProjectInvitationWithProfile,
  ProjectWithDetails,
} from "@/types/project.types";
import {
  SubtaskInput,
  TaskResult,
  TaskUpdateWithSubtasks,
} from "@/types/task.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

// Comment Mutations
export const useCreateComment = (contentId = "", taskSlug = "") => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { tasks, updateTask, user, profile } = useAppStore();
  const currentTask = tasks.find(t => t.task.slug === taskSlug);

  return useMutation({
    mutationFn: async (content: string) => {
      if (!contentId) throw new Error("Content ID is required");
      const { data, error } = await createCommentAction({
        content,
        content_id: contentId,
        content_type: "task",
      });
      if (error) throw error;
      return data;
    },
    onMutate: async content => {
      await queryClient.cancelQueries({ queryKey: ["task", taskSlug] });
      const previousTask = queryClient.getQueryData<TaskResult>([
        "task",
        taskSlug,
      ]);

      if (currentTask && user?.id && profile?.profile) {
        const optimisticComment: CommentWithProfile = {
          id: `temp-${Date.now()}`,
          content,
          content_id: contentId,
          content_type: "task",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_edited: false,
          user: {
            id: user.id,
            display_name: profile.profile.display_name,
            avatar_url: profile.profile.avatar_url,
            professional_title: profile.profile.professional_title,
          },
          parent_id: null,
          thread_id: null,
          user_id: user.id,
        };

        const updatedTask = {
          ...currentTask,
          comments: [...(currentTask.comments || []), optimisticComment],
        };

        queryClient.setQueryData(["task", taskSlug], updatedTask);
        updateTask(currentTask.task.id, updatedTask);
      }

      return { previousTask };
    },
    onError: (err, newComment, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(["task", taskSlug], context.previousTask);
        updateTask(context.previousTask.task.id, context.previousTask);
      }

      toast({
        title: "Error adding comment",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskSlug] });
    },
  });
};

// Task Mutations with Enhanced Caching
const useCreateTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { addTask } = useAppStore();

  return useMutation({
    mutationFn: async (task: Tables<"tasks">) => {
      const { data, error } = await createTaskAction(task);
      if (error) throw error;
      return data;
    },
    onMutate: async newTask => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<TaskResult[]>(["tasks"]);

      const optimisticTask: TaskResult = {
        task: {
          ...newTask,
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        subtasks: [],
        comments: [],
        task_schedule: null,
        assignee_profile: null,
        project: null,
      };

      queryClient.setQueryData<TaskResult[]>(["tasks"], old =>
        old ? [...old, optimisticTask] : [optimisticTask],
      );

      addTask(optimisticTask);

      return { previousTasks };
    },
    onError: (err, newTask, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }

      toast({
        title: "Error creating task",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { updateTask: updateStoreTask } = useAppStore();

  return useMutation({
    mutationFn: async ({
      slug,
      updates,
    }: {
      slug: string;
      updates: TaskUpdateWithSubtasks;
    }) => {
      const { data, error } = await updateTaskAction(slug, updates);
      if (error) throw error;
      return data;
    },
    onMutate: async ({ slug, updates }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["task", slug] });
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot current state
      const previousTask = queryClient.getQueryData<TaskResult>(["task", slug]);
      const previousTasks = queryClient.getQueryData<TaskResult[]>(["tasks"]);

      if (previousTask) {
        // Create optimistic update
        const optimisticTask = {
          ...previousTask,
          task: { ...previousTask.task, ...updates },
        };

        // Update task cache
        queryClient.setQueryData(["task", slug], optimisticTask);

        // Update tasks list cache
        queryClient.setQueryData<TaskResult[]>(["tasks"], old =>
          old?.map(t => (t.task.slug === slug ? optimisticTask : t)),
        );

        // Update store
        updateStoreTask(previousTask.task.id, optimisticTask);
      }

      return { previousTask, previousTasks };
    },
    onError: (err, variables, context) => {
      // Revert caches
      if (context?.previousTask) {
        queryClient.setQueryData(
          ["task", variables.slug],
          context.previousTask,
        );
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }

      toast({
        title: "Error updating task",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task", variables.slug] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

// Project Mutations with Enhanced Caching
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const { setProfile, profile } = useAppStore();

  return useMutation({
    mutationFn: async (project: {
      name: string;
      description: string;
      prefix: string;
      slug: string;
    }): Promise<ProjectWithDetails> => {
      const { data, error } = await createProjectAction(project);
      if (error) throw error;
      if (!data) throw new Error("No data returned from server");
      return data;
    },
    onMutate: async newProject => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      await queryClient.cancelQueries({ queryKey: ["profile"] });

      const previousProjects = queryClient.getQueryData<ProjectWithDetails[]>([
        "projects",
      ]);
      const previousProfile = queryClient.getQueryData<ProfileWithDetails>([
        "profile",
      ]);

      const optimisticProject: ProjectWithDetails = {
        ...newProject,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "active",
        github_owner: null,
        github_repo: null,
        github_repo_url: null,
        project_members: [],
        project_invitations: [],
        tasks: [],
      };

      queryClient.setQueryData<ProjectWithDetails[]>(["projects"], old =>
        old ? [...old, optimisticProject] : [optimisticProject],
      );

      if (profile) {
        const updatedProfile: ProfileWithDetails = {
          ...profile,
          projects: [
            ...profile.projects,
            {
              project: optimisticProject,
              role: "owner",
              created_at: new Date().toISOString(),
            },
          ],
        };
        setProfile(updatedProfile);
      }

      return { previousProjects, previousProfile };
    },
    onError: (err, newProject, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(["projects"], context.previousProjects);
      }
      if (context?.previousProfile) {
        queryClient.setQueryData(["profile"], context.previousProfile);
      }
      toast({
        title: "Error creating project",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    },
    onSuccess: data => {
      if (data.slug) {
        router.push(
          configuration.paths.project.overview({ project_slug: data.slug }),
        );
      }
      toast({
        title: "Project created successfully",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { tasks, updateTask } = useAppStore();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data, error } = await updateCommentAction({ id, content });
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, content }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["task"] });

      // Find task containing this comment
      const task = tasks.find(t => t.comments?.some(c => c.id === id));
      if (!task) return;

      // Snapshot previous state
      const previousTask = queryClient.getQueryData<TaskResult>([
        "task",
        task.task.slug,
      ]);

      // Optimistically update comment
      const updatedComments = task.comments?.map(comment =>
        comment.id === id ? { ...comment, content, is_edited: true } : comment,
      );

      const optimisticTask = { ...task, comments: updatedComments };

      // Update all caches
      queryClient.setQueryData(["task", task.task.slug], optimisticTask);
      updateTask(task.task.id, optimisticTask);

      return { previousTask };
    },
    onError: (err, variables, context) => {
      if (context?.previousTask) {
        // Revert cache to previous state
        queryClient.setQueryData(
          ["task", context.previousTask.task.slug],
          context.previousTask,
        );
        updateTask(context.previousTask.task.id, context.previousTask);
      }
      toast({
        title: "Error updating comment",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["task"] });
    },
  });
};

export const useRespondToInvitation = () => {
  const queryClient = useQueryClient();
  const { setProfile, profile } = useAppStore();

  return useMutation({
    mutationFn: async ({
      invitationId,
      accept,
    }: {
      invitationId: string;
      accept: boolean;
    }): Promise<ProjectInvitationWithProfile> => {
      const { data, error } = await respondToInvitationAction({
        invitationId,
        accept,
      });
      if (error) throw new Error(error);
      if (!data) throw new Error("No data returned");
      return data;
    },
    onMutate: async ({ invitationId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["profile"] });
      await queryClient.cancelQueries({ queryKey: ["user-invites"] });

      // Snapshot previous state
      const previousProfile = queryClient.getQueryData(["profile"]);
      const previousInvites = queryClient.getQueryData(["user-invites"]);

      if (profile) {
        const updatedProfile = {
          ...profile,
          pending_invitations: profile.pending_invitations.filter(
            inv => inv.invitation.id !== invitationId,
          ),
        };
        // Update cache
        queryClient.setQueryData(["profile"], updatedProfile);
        setProfile(updatedProfile);
      }

      return { previousProfile, previousInvites };
    },
    onError: (err, variables, context) => {
      // Revert cache on error
      if (context?.previousProfile) {
        queryClient.setQueryData(["profile"], context.previousProfile);
        setProfile(context.previousProfile as ProfileWithDetails | null);
      }
      if (context?.previousInvites) {
        queryClient.setQueryData(["user-invites"], context.previousInvites);
      }
    },
    onSettled: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      queryClient.invalidateQueries({ queryKey: ["user-invites"] });
      queryClient.invalidateQueries({ queryKey: ["layout-data"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

export const useDeleteInvitation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { setProfile, profile } = useAppStore();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await deleteInvitationAction(invitationId);
      if (error) throw new Error(error);
      return invitationId;
    },
    onMutate: async invitationId => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["project"] });
      await queryClient.cancelQueries({ queryKey: ["user-invites"] });

      // Snapshot previous states
      const previousProfile = queryClient.getQueryData(["profile"]);
      const previousInvites = queryClient.getQueryData(["user-invites"]);

      if (profile) {
        const updatedProfile = {
          ...profile,
          pending_invitations: profile.pending_invitations.filter(
            inv => inv.invitation.id !== invitationId,
          ),
        };
        // Update cache
        queryClient.setQueryData(["profile"], updatedProfile);
        setProfile(updatedProfile);
      }

      return { previousProfile, previousInvites };
    },
    onError: (err, variables, context) => {
      // Revert cache on error
      if (context?.previousProfile) {
        queryClient.setQueryData(["profile"], context.previousProfile);
        setProfile(context.previousProfile as ProfileWithDetails | null);
      }
      if (context?.previousInvites) {
        queryClient.setQueryData(["user-invites"], context.previousInvites);
      }
      toast({
        title: "Error deleting invitation",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["project"] });
      queryClient.invalidateQueries({ queryKey: ["user-invites"] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const { setProfile, profile } = useAppStore();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await deleteProjectAction(projectId);
      if (error) throw error;
      return projectId;
    },
    onMutate: async projectId => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      await queryClient.cancelQueries({ queryKey: ["profile"] });

      // Snapshot previous states
      const previousProfile = queryClient.getQueryData(["profile"]);
      const previousProjects = queryClient.getQueryData(["projects"]);

      if (profile) {
        const updatedProfile = {
          ...profile,
          projects: profile.projects.filter(p => p.project.id !== projectId),
          current_project:
            profile.current_project?.id === projectId
              ? null
              : profile.current_project,
        };
        // Update cache
        queryClient.setQueryData(["profile"], updatedProfile);
        queryClient.setQueryData<ProjectWithDetails[]>(["projects"], old =>
          old?.filter(p => p.id !== projectId),
        );
        setProfile(updatedProfile);
      }

      return { previousProfile, previousProjects };
    },
    onError: (err, variables, context) => {
      // Revert cache on error
      if (context?.previousProfile) {
        queryClient.setQueryData(["profile"], context.previousProfile);
        setProfile(context.previousProfile as ProfileWithDetails | null);
      }
      if (context?.previousProjects) {
        queryClient.setQueryData(["projects"], context.previousProjects);
      }
      toast({
        title: "Error deleting project",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      router.push(configuration.paths.appHome);
    },
  });
};

export const useInviteMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { updateProject: updateStoreProject } = useAppStore();

  return useMutation({
    mutationFn: async (invitation: InviteMemberInput) => {
      const { data, error } = await inviteMemberAction(invitation);
      if (error) throw error;
      return data;
    },
    onMutate: async invitation => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["project"] });
      await queryClient.cancelQueries({ queryKey: ["profile"] });

      // Snapshot previous state
      const previousProject = queryClient.getQueryData<ProjectWithDetails>([
        "project",
      ]);

      if (previousProject) {
        // Create the optimistic invitation with required fields
        const optimisticInvitation: ProjectInvitationWithProfile = {
          id: `temp-${Date.now()}`,
          project_id: invitation.project_id,
          email: invitation.email,
          role: invitation.role,
          invited_by: invitation.invited_by,
          status: "pending",
          created_at: new Date().toISOString(),
          expires_at:
            invitation.expires_at ||
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          inviter: null,
        };

        // Create optimistic project update
        const optimisticProject: Partial<ProjectWithDetails> = {
          ...previousProject,
          project_invitations: [
            ...previousProject.project_invitations,
            optimisticInvitation,
          ],
        };

        // Update cache
        queryClient.setQueryData(["project"], optimisticProject);
        updateStoreProject(invitation.project_id, optimisticProject);
      }

      return { previousProject };
    },
    onError: (error, variables, context) => {
      // Revert cache on error
      if (context?.previousProject) {
        queryClient.setQueryData(["project"], context.previousProject);
        updateStoreProject(variables.project_id, context.previousProject);
      }

      toast({
        title: "Error sending invitation",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent successfully",
      });
    },
    onSettled: () => {
      // Always invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["project"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { removeTask } = useAppStore();

  return useMutation({
    mutationFn: async (taskSlug: string) => {
      const { error } = await deleteTaskAction(taskSlug);
      if (error) throw error;
      return taskSlug;
    },
    onMutate: async taskSlug => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      await queryClient.cancelQueries({ queryKey: ["task", taskSlug] });

      // Snapshot previous states
      const previousTasks = queryClient.getQueryData(["tasks"]);
      const previousTask = queryClient.getQueryData(["task", taskSlug]);

      // Optimistically remove task from cache
      queryClient.setQueryData<TaskResult[]>(["tasks"], old =>
        old?.filter(t => t.task.slug !== taskSlug),
      );
      queryClient.removeQueries({ queryKey: ["task", taskSlug] });

      const task = queryClient.getQueryData<TaskResult>(["task", taskSlug]);
      if (task) {
        removeTask(task.task.id);
      }

      return { previousTasks, previousTask };
    },
    onError: (err, variables, context) => {
      // Revert cache on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
      if (context?.previousTask) {
        queryClient.setQueryData(["task", variables], context.previousTask);
      }
      toast({
        title: "Error deleting task",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

export const useDeleteSubtask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { updateTask } = useAppStore();

  return useMutation({
    mutationFn: async (subtaskId: string) => {
      const { error } = await deleteSubtaskAction(subtaskId);
      if (error) throw error;
      return subtaskId;
    },
    onMutate: async subtaskId => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["task"] });
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Find affected task and store previous state
      const tasks = queryClient.getQueryData<TaskResult[]>(["tasks"]) || [];
      const task = tasks.find(t => t.subtasks?.some(s => s.id === subtaskId));
      const previousState = {
        task: task ? { ...task } : null,
        tasks: [...tasks],
      };

      if (task) {
        // Create optimistic update
        const updatedTask = {
          ...task,
          subtasks: task.subtasks?.filter(s => s.id !== subtaskId) || [],
        };

        // Update caches and store
        queryClient.setQueryData(["task", task.task.slug], updatedTask);
        queryClient.setQueryData<TaskResult[]>(
          ["tasks"],
          tasks.map(t => (t.task.id === task.task.id ? updatedTask : t)),
        );
        updateTask(task.task.id, updatedTask);
      }

      // Return context for potential rollback
      return previousState;
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.task) {
        queryClient.setQueryData(
          ["task", context.task.task.slug],
          context.task,
        );
        queryClient.setQueryData(["tasks"], context.tasks);
        updateTask(context.task.task.id, context.task);
      }

      toast({
        title: error.message,
        description: "Failed to delete subtask",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["task"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

export const useUpdateProfile = () => {
  const hookName = "useUpdateProfile";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { setProfile } = useAppStore();

  return useMutation({
    mutationFn: async (updates: UpdateProfileInput) => {
      const { data, error } = await updateProfileAction(updates);
      conditionalLog(hookName, { data, error }, false);
      if (error) throw error;
      return data;
    },
    onSuccess: data => {
      conditionalLog(hookName, { success: data }, false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      if (data) {
        setProfile(data);
      }
      toast({
        title: "Profile updated successfully",
      });
    },
    onError: (error: Error) => {
      conditionalLog(hookName, { error }, false);
      toast({
        title: "Error updating profile",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteProjectMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { updateProject } = useAppStore();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await deleteProjectMemberAction(memberId);
      if (error) throw error;
      return memberId;
    },
    onMutate: async memberId => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["project"] });
      await queryClient.cancelQueries({ queryKey: ["profile"] });

      // Snapshot previous state
      const previousProject = queryClient.getQueryData<ProjectWithDetails>([
        "project",
      ]);
      const previousProfile = queryClient.getQueryData<ProfileWithDetails>([
        "profile",
      ]);

      if (previousProject) {
        // Create optimistic update
        const optimisticProject = {
          ...previousProject,
          project_members: previousProject.project_members.filter(
            m => m.id !== memberId,
          ),
        };

        // Update cache
        queryClient.setQueryData(["project"], optimisticProject);
        updateProject(previousProject.id, optimisticProject);
      }

      return { previousProject, previousProfile };
    },
    onError: (error, variables, context) => {
      // Revert caches on error
      if (context?.previousProject) {
        queryClient.setQueryData(["project"], context.previousProject);
        updateProject(context.previousProject.id, context.previousProject);
      }
      if (context?.previousProfile) {
        queryClient.setQueryData(["profile"], context.previousProfile);
      }

      toast({
        title: "Error removing member",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Member removed successfully",
      });
    },
    onSettled: () => {
      // Always invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["project"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { updateProject: updateStoreProject } = useAppStore();

  return useMutation({
    mutationFn: async ({
      projectId,
      updates,
    }: {
      projectId: string;
      updates: TablesUpdate<"projects">;
    }) => {
      const { data, error } = await updateProjectAction(projectId, updates);
      if (error) throw error;
      return data;
    },
    onMutate: async ({ projectId, updates }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["project", projectId] });
      await queryClient.cancelQueries({ queryKey: ["projects"] });

      // Snapshot current state
      const previousProject = queryClient.getQueryData<ProjectWithDetails>([
        "project",
        projectId,
      ]);
      const previousProjects = queryClient.getQueryData<ProjectWithDetails[]>([
        "projects",
      ]);

      if (previousProject) {
        // Create optimistic update
        const optimisticProject = {
          ...previousProject,
          ...updates,
          updated_at: new Date().toISOString(),
        };

        // Update project cache
        queryClient.setQueryData(["project", projectId], optimisticProject);

        // Update projects list cache
        queryClient.setQueryData<ProjectWithDetails[]>(["projects"], old =>
          old?.map(p => (p.id === projectId ? optimisticProject : p)),
        );

        // Update store
        updateStoreProject(projectId, optimisticProject);
      }

      return { previousProject, previousProjects };
    },
    onError: (error, variables, context) => {
      // Revert caches
      if (context?.previousProject) {
        queryClient.setQueryData(
          ["project", variables.projectId],
          context.previousProject,
        );
      }
      if (context?.previousProjects) {
        queryClient.setQueryData(["projects"], context.previousProjects);
      }

      toast({
        title: "Error updating project",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Project updated successfully",
      });
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useGetProjectSlug = () => {
  const hookName = "useGetProjectSlug";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectName: string) => {
      const { data, error } = await getProjectSlugAction(projectName);
      conditionalLog(hookName, { data, error }, false);
      if (error) throw new Error(error);
      return data;
    },
    onError: (error: Error) => {
      conditionalLog(hookName, { error }, false);
      toast({
        title: "Error generating project slug",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
    onSuccess: data => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      return data;
    },
  });
};

export const useCreateSubtask = (taskId = "") => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const hookName = "useCreateSubtask";

  return useMutation({
    mutationFn: async (subtask: SubtaskInput) => {
      if (!taskId) throw new Error("Task ID is required");
      const { data, error } = await createSubtaskAction(subtask);
      conditionalLog(hookName, { data, error }, false);
      if (error) throw error;
      return data;
    },
    onMutate: async subtask => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["task", taskId] });
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot the previous value
      const previousTask = queryClient.getQueryData<TaskResult>([
        "task",
        taskId,
      ]);

      // Get the current highest ordinal_id
      const currentSubtasks = previousTask?.subtasks || [];
      const nextOrdinalId =
        currentSubtasks.length > 0
          ? Math.max(...currentSubtasks.map(s => s.ordinal_id)) + 1
          : 1;

      // Create optimistic subtask with all required fields
      const optimisticSubtask: Tables<"subtasks"> = {
        id: `temp-${Date.now()}`,
        task_id: taskId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        title: subtask.title,
        description: subtask.description || null,
        status: subtask.status || "todo",
        budget_cents: subtask.budget_cents || null,
        ordinal_id: nextOrdinalId,
      };

      // Optimistically update the task cache
      queryClient.setQueryData<TaskResult>(["task", taskId], old => {
        if (!old) return old;
        return {
          ...old,
          subtasks: [...old.subtasks, optimisticSubtask],
        };
      });

      return { previousTask };
    },
    onError: (error, newSubtask, context) => {
      // Revert the optimistic update on error
      if (context?.previousTask) {
        queryClient.setQueryData(["task", taskId], context.previousTask);
      }

      toast({
        title: "Error creating subtask",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Subtask created successfully",
      });
    },
    onSettled: () => {
      // Always invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};
