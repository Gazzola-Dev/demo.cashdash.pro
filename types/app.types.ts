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
export type Profile = Partial<Tables<"profiles">>;
export type Project = Partial<Tables<"projects">>;
export type ProjectMember = Partial<Tables<"project_members">>;
export type ProjectInvitation = Partial<Tables<"project_invitations">>;
export type Task = Partial<Tables<"tasks">>;
export type Subtask = Partial<Tables<"subtasks">>;
export type ProjectSubscription = Partial<Tables<"project_subscriptions">>;
export type UserRole = Partial<Tables<"user_roles">>;
export type Milestone = Partial<Tables<"milestones">>;
export type Contract = Partial<Tables<"contracts">>;
export type ContractPayment = Partial<Tables<"contract_payments">>;

// Define member with profile
export interface ProjectMemberWithProfile extends ProjectMember {
  profile: Profile | null;
}

// Define invitation with profile
export interface ProjectInvitationWithProfile extends ProjectInvitation {
  profile: Profile | null;
}

// Combined ProjectInvitationWithDetails and ProjectInvitationWithProfile
export interface ProjectInvitationWithDetails extends ProjectInvitation {
  invitation?: ProjectInvitation;
  profile?: Profile | null;
  project?: Project;
  sender_profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    professional_title: string | null;
  };
}

// Define project with relationships
export interface ProjectWithDetails extends Project {
  project_members: Partial<ProjectMemberWithProfile>[];
  project_invitations: Partial<ProjectInvitationWithDetails>[];
}

// Define task with assignee
export interface TaskWithAssignee extends Task {
  assignee_profile: Profile | null;
  schedule?: {
    due_date: string | null;
    start_date: string | null;
    estimated_hours: number | null;
    actual_hours: number | null;
    completed_at: string | null;
  } | null;
  tags?: string[];
}

// Define complete task with all relationships
export interface TaskComplete extends TaskWithAssignee {
  comments: CommentWithProfile[];
  subtasks: Subtask[];
}

// Define milestone with tasks
export interface MilestoneWithTasks extends Milestone {
  tasks?: TaskWithAssignee[];
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

// Contract payment interface
export interface ContractPaymentWithDetails extends ContractPayment {
  milestone_id: string | null;
}

// Update the ContractMember interface
export interface ContractMember {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string;
  hasApproved: boolean;
}
// Extend the Contract type to include milestone relationship information
export interface ContractWithMilestone extends Tables<"contracts"> {
  milestone_reference_id?: string; // To store reference to milestone
}

// Update the ContractWithMembers interface to include milestone relationship
export interface ContractWithMembers extends ContractWithMilestone {
  members: Partial<ContractMember>[];
  payments: Partial<Tables<"contract_payments">>[];
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
  user: Partial<User> | null;
  profile: Partial<Profile> | null;

  // Projects data
  projects: Partial<Project>[];
  project: Partial<ProjectWithDetails> | null;

  // Tasks data
  tasks: Partial<TaskWithAssignee>[];
  task: Partial<TaskComplete> | null;

  // Milestones data
  milestones: Partial<MilestoneWithTasks>[];
  milestone: Partial<MilestoneWithTasks> | null;

  // Invitations data
  userInvitations: Partial<ProjectInvitationWithDetails>[];
  projectInvitations: Partial<ProjectInvitationWithDetails>[];

  // Contract data
  contract: Partial<ContractWithMembers> | null;

  // Role data
  appRole: string | null;
  isAdmin: boolean;
  projectMemberRole: string | null;

  // Actions
  setUser: (user: Partial<User> | null) => void;
  setProfile: (profile: Partial<Profile> | null) => void;
  setProjects: (projects: Partial<Project>[]) => void;
  setProject: (project: Partial<ProjectWithDetails> | null) => void;
  setTasks: (tasks: Partial<TaskWithAssignee>[]) => void;
  setTask: (task: Partial<TaskComplete> | null) => void;
  setMilestones: (milestones: Partial<MilestoneWithTasks>[]) => void;
  setMilestone: (milestone: Partial<MilestoneWithTasks> | null) => void;
  setUserInvitations: (
    invitations: Partial<ProjectInvitationWithDetails>[],
  ) => void;
  setProjectInvitations: (
    invitations: Partial<ProjectInvitationWithDetails>[],
  ) => void;
  setAppRole: (appRole: Partial<string> | null) => void;
  setProjectMemberRole: (projectMemberRole: Partial<string> | null) => void;
  setContract: (contract: Partial<ContractWithMembers> | null) => void;
  reset: () => void;
}
