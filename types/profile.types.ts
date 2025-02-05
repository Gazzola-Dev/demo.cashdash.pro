// types/profile.types.ts

import { ActionResponse } from "@/types/action.types";
import { Tables } from "@/types/database.types";

// Base types from database
type Profile = Tables<"profiles">;
type Project = Tables<"projects">;

// Project with role information
export interface ProjectWithRole extends Project {
  role: string;
  created_at: string;
}

// Profile with related data
export interface ProfileWithDetails {
  profile: Profile;
  projects: {
    project: Project;
    role: string;
    created_at: string;
  }[];
  current_project?: Project;
  notification_settings?: {
    email: boolean;
    push: boolean;
    taskUpdates: boolean;
    projectUpdates: boolean;
  };
  ui_settings?: {
    theme: "light" | "dark" | "system";
    compactView: boolean;
    showAvatars: boolean;
  };
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
