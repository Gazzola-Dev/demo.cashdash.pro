// types/app.types.ts
import { Tables } from "@/types/database.types";
import { User } from "@supabase/supabase-js";

// types/comment.types.ts
import { ActionResponse } from "@/types/action.types";

// Only include the profile fields needed for comments
export interface CommentProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  professional_title: string | null;
}

export interface CommentWithProfile extends Tables<"comments"> {
  user: CommentProfile;
}

export interface CommentListResponse
  extends ActionResponse<CommentWithProfile[]> {}

// Base Database Types
type Profile = Tables<"profiles">;
type Project = Tables<"projects">;
type ProjectMember = Tables<"project_members">;
type ProjectInvitation = Tables<"project_invitations">;
type Task = Tables<"tasks">;
type Subtask = Tables<"subtasks">;
type ProjectSubscription = Tables<"project_subscriptions">;
type UserRole = Tables<"user_roles">;

// Define member with profile
export interface ProjectMemberWithProfile extends ProjectMember {
  profile: Profile | null;
}

// Define invitation with profile
export interface ProjectInvitationWithProfile extends ProjectInvitation {
  profile: Profile | null;
}

// Define project with relationships
export interface ProjectWithDetails extends Project {
  project_members: ProjectMemberWithProfile[];
  project_invitations: ProjectInvitationWithProfile[];
}

// Define task with assignee
export interface TaskWithAssignee extends Task {
  assignee_profile: Profile | null;
}

// Define complete task with all relationships
export interface TaskComplete extends TaskWithAssignee {
  comments: CommentWithProfile[];
  subtasks: Subtask[];
}

// Define the main app state interface
export interface AppState {
  // Core user data
  user: User | null;
  profile: Profile | null;

  // Projects data
  projects: Project[];
  project: ProjectWithDetails | null;

  // Tasks data
  tasks: TaskWithAssignee[];
  task: TaskComplete | null;
  invitations: ProjectInvitation[];

  // Subscription data
  subscription: ProjectSubscription | null;

  // Role data
  appRole: string | null;
  isAdmin: boolean;
  projectMemberRole: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setProjects: (projects: Project[]) => void;
  setProject: (project: ProjectWithDetails | null) => void;
  setTasks: (tasks: TaskWithAssignee[]) => void;
  setTask: (task: TaskComplete | null) => void;
  setInvitations: (invitations: ProjectInvitation[]) => void;
  setSubscription: (subscription: ProjectSubscription | null) => void;
  setAppRole: (appRole: string | null) => void;
  setProjectMemberRole: (projectMemberRole: string | null) => void;
  reset: () => void;
}
