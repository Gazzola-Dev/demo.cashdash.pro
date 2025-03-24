// types/app.types.ts
import { Tables } from "@/types/database.types";
import { User } from "@supabase/supabase-js";

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

export interface CommentListResponse {
  data: CommentWithProfile[] | null;
  error: string | null;
}

// Base Database Types
type Profile = Tables<"profiles">;
type Project = Tables<"projects">;
type ProjectMember = Tables<"project_members">;
type ProjectInvitation = Tables<"project_invitations">;
type Task = Tables<"tasks">;
type Subtask = Tables<"subtasks">;
type ProjectSubscription = Tables<"project_subscriptions">;
type UserRole = Tables<"user_roles">;
type Milestone = Tables<"milestones">;
type Contract = Tables<"contracts">;

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

// Define milestone with tasks
export interface MilestoneWithTasks extends Milestone {
  tasks?: { id: string; title: string }[];
  tasks_count?: number;
  tasks_completed?: number;
  is_current?: boolean;
  events?: MilestoneEvent[]; // Add events to the interface
}

export interface MilestoneEventActor {
  id: string | null;
  name: string | null;
  role: string; // 'pm' | 'client' | 'system' | 'developer'
  avatar: string | null;
}

// Define the milestone event
export interface MilestoneEvent {
  id: string;
  milestone_id: string;
  event_type: string;
  action: string;
  details: string | null;
  icon_type: string | null;
  created_at: string;
  actor: MilestoneEventActor;
}

// Define ContractMember interface
export interface ContractMember {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url?: string | null;
  role?: string | null;
  hasApproved?: boolean;
}

// Define Contract with Members
export interface ContractWithMembers extends Contract {
  members: ContractMember[];
}

// Project Invitation With Details for the invitation.hooks and actions
export interface ProjectInvitationWithDetails {
  invitation: ProjectInvitation;
  project: Project;
  sender_profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    professional_title: string | null;
  };
}

// Invitation Response type for invitation.actions
export interface InvitationResponse {
  project: Project;
  success: boolean;
}

// DialogProps for useDialogQueue in AppProvider
export interface DialogProps {
  title: string;
  description: string;
  onConfirm: () => void;
  content?: React.ReactNode;
  isLoading?: boolean;
}

// InvitationModalProps for AppProvider
export interface InvitationModalProps {
  invitation: ProjectInvitationWithDetails;
  onAccept: () => void;
  onDecline: () => void;
  isLoading: boolean;
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
  userInvitations: ProjectInvitationWithDetails[]; // Updated to match the actual type used in hooks
  projectInvitations: ProjectInvitationWithDetails[]; // Updated to match the actual type used in hooks

  // Milestone data
  milestone: MilestoneWithTasks | null;

  // Contract data
  contract: ContractWithMembers | null;

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
  setUserInvitations: (invitations: ProjectInvitationWithDetails[]) => void; // Updated to match the actual type
  setProjectInvitations: (invitations: ProjectInvitationWithDetails[]) => void; // Updated to match the actual type
  setSubscription: (subscription: ProjectSubscription | null) => void;
  setAppRole: (appRole: string | null) => void;
  setProjectMemberRole: (projectMemberRole: string | null) => void;
  setMilestone: (milestone: MilestoneWithTasks | null) => void;
  setContract: (contract: ContractWithMembers | null) => void;
  reset: () => void;
}

// Contract Member Type
export interface ContractMember {
  id: string;
  display_name: string | null;
  email: string;
  hasApproved?: boolean;
  avatar_url?: string | null;
  role?: string | null;
}

// Contract with Members Type
export interface ContractWithMembers {
  contract: Contract;
  members: ContractMember[];
}
