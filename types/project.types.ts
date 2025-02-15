import { ActionResponse } from "@/types/action.types";
import { Tables } from "@/types/database.types";
import { ProfileWithDetails } from "@/types/profile.types";

// Base types from database
export type Project = Tables<"projects">;
type ProjectMember = Tables<"project_members">;
type ProjectInvitation = Tables<"project_invitations">;
type Task = Tables<"tasks">;
type Profile = Tables<"profiles">;

// Required project type ensures all project fields are non-null
export interface RequiredProject extends Project {
  id: NonNullable<Project["id"]>;
  name: NonNullable<Project["name"]>;
  description: Project["description"];
  status: NonNullable<Project["status"]>;
  slug: NonNullable<Project["slug"]>;
  prefix: NonNullable<Project["prefix"]>;
  github_repo_url: Project["github_repo_url"];
  github_owner: Project["github_owner"];
  github_repo: Project["github_repo"];
  created_at: NonNullable<Project["created_at"]>;
  updated_at: NonNullable<Project["updated_at"]>;
}

// Profile with required email
export interface ProfileWithEmail extends Profile {
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  professional_title: string | null;
}

// Member with profile relationship
export interface ProjectMemberWithProfile extends ProjectMember {
  profile: Profile | null;
}
// Invitation with inviter profile relationship
export interface ProjectInvitationWithProfile extends ProjectInvitation {
  inviter: ProfileWithDetails | null;
}

// Project with all relationships
export interface ProjectWithDetails extends Project {
  project_members: ProjectMemberWithProfile[];
  project_invitations: ProjectInvitationWithProfile[];
  tasks: Task[];
}

// Input types for invitations
export interface InvitationInput {
  email: string;
  projectId: string;
  role?: "admin" | "member";
}

// Response types
export interface ProjectResponse extends ActionResponse<ProjectWithDetails> {}
export interface ProjectListResponse
  extends ActionResponse<ProjectWithDetails[]> {}
export interface InvitationResponse
  extends ActionResponse<ProjectInvitationWithProfile> {}

// Filter types for listing projects
export interface ProjectFilters {
  status?: Project["status"];
  search?: string;
  sort?: keyof Project;
  order?: "asc" | "desc";
}

// Status options
export const PROJECT_STATUS_OPTIONS: Project["status"][] = [
  "active",
  "archived",
  "completed",
];

export interface ProjectMemberResponse
  extends ActionResponse<ProjectMemberWithProfile> {}

export interface InviteMemberInput {
  email: string;
  project_id: string;
  role: "admin" | "member";
  invited_by: string;
  expires_at?: string;
}
