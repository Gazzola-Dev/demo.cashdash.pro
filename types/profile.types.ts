import { ActionResponse } from "@/types/action.types";
import { Tables } from "@/types/database.types";
import { ProjectWithDetails } from "@/types/project.types";
import { TaskResult } from "@/types/task.types";

// Base types from database
type Profile = Tables<"profiles">;
type Project = Tables<"projects">;
type ProjectInvitation = Tables<"project_invitations">;

// Profile with all relationships
export interface ProfileWithDetails {
  profile: Profile;
  projects: {
    project: Project;
    role: string;
    created_at: string;
  }[];
  current_project: ProjectWithDetails | null;
  tasks: TaskResult[];
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
