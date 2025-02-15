import { ActionResponse } from "@/types/action.types";
import { Tables } from "@/types/database.types";

// Base types from database
type Profile = Tables<"profiles">;
type Project = Tables<"projects">;
type ProjectInvitation = Tables<"project_invitations">;
type ProjectMember = Tables<"project_members">;
type Task = Tables<"tasks">;

// Extended types for relationships
export interface ProjectMemberWithProfile extends ProjectMember {
  profile: Profile | null;
}

export interface ProjectInvitationWithProfile extends ProjectInvitation {
  inviter: Profile | null;
}

// Project with related data
export interface ProjectWithDetails extends Project {
  project_members: ProjectMemberWithProfile[];
  project_invitations: ProjectInvitationWithProfile[];
  tasks: Task[];
}

// Profile with all relationships
export interface ProfileWithDetails {
  profile: Profile;
  projects: {
    project: Project;
    role: string;
    created_at: string;
  }[];
  current_project: ProjectWithDetails | null;
  project_members: ProjectMemberWithProfile[];
  project_invitations: ProjectInvitationWithProfile[];
  tasks: Task[];
  drafts: Task[];
  pending_invitations: {
    invitation: ProjectInvitation;
    project: Project;
    inviter: Profile;
  }[];
}

// Response types
export interface ProfileResponse extends ActionResponse<ProfileWithDetails> {}

// Input types for profile updates
export interface UpdateProfileInput {
  display_name?: Profile["display_name"];
  avatar_url?: Profile["avatar_url"];
  professional_title?: Profile["professional_title"];
  bio?: Profile["bio"];
  github_username?: Profile["github_username"];
  timezone?: Profile["timezone"];
  website?: Profile["website"];
  notification_preferences?: Profile["notification_preferences"];
  ui_preferences?: Profile["ui_preferences"];
  current_project_id?: Profile["current_project_id"];
}
