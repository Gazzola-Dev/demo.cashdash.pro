import { ActionResponse } from "@/types/action.types";
import { Tables } from "@/types/database.types";

// Base types from database
type ProjectMember = Tables<"project_members">;
type ProjectInvitation = Tables<"project_invitations">;
type Profile = Tables<"profiles">;
type Project = Tables<"projects">;

// Extended types for relationships
export interface ProjectMemberWithProfile extends ProjectMember {
  profile: Profile;
  project: Project;
}

export interface ProjectInvitationWithDetails extends ProjectInvitation {
  inviter: Profile;
  project: Project;
}

// Response types
export interface MemberResponse
  extends ActionResponse<ProjectMemberWithProfile> {}
export interface MemberListResponse
  extends ActionResponse<ProjectMemberWithProfile[]> {}
export interface InvitationResponse
  extends ActionResponse<ProjectInvitationWithDetails> {}
export interface InvitationListResponse
  extends ActionResponse<ProjectInvitationWithDetails[]> {}

// Input types for member operations
export interface MembershipInput
  extends Pick<ProjectMember, "project_id" | "user_id" | "role"> {}
export interface InvitationInput
  extends Pick<ProjectInvitation, "project_id" | "email" | "role"> {}
