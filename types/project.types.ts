// project.types.ts
import { ActionResponse } from "@/types/action.types";
import { Database, Tables } from "@/types/database.types";

// TODO: cleanup, delete unused types

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProjectMemberRow = Database["public"]["Tables"]["project_members"]["Row"];
type ProjectInvitationRow =
  Database["public"]["Tables"]["project_invitations"]["Row"];
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type ExternalIntegrationRow =
  Database["public"]["Tables"]["external_integrations"]["Row"];
type ProjectMetricsRow = Database["public"]["Tables"]["project_metrics"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

interface SupabaseProjectMember extends Omit<ProjectMemberRow, "profile"> {
  profile: ProfileRow[];
}

interface SupabaseProjectInvitation
  extends Omit<ProjectInvitationRow, "inviter"> {
  inviter: ProfileRow[];
}

export interface SupabaseProject extends ProjectRow {
  project_members: SupabaseProjectMember[];
  project_invitations: SupabaseProjectInvitation[];
  tasks: TaskRow[];
  external_integrations: ExternalIntegrationRow[];
  project_metrics: ProjectMetricsRow[];
}

// Base types from database
type Project = Tables<"projects">;
export type ProjectMember = Tables<"project_members">;
type Task = Tables<"tasks">;
type ExternalIntegration = Tables<"external_integrations">;
type ProjectMetrics = Tables<"project_metrics">;
type Profile = Tables<"profiles">;
type ProjectInvitation = Tables<"project_invitations">;

// Extended types for relationships
export interface ProjectMemberWithProfile extends ProjectMember {
  profile: Profile;
}

export interface ProjectInvitationWithProfile extends ProjectInvitation {
  inviter: Profile;
}

export interface ProjectWithDetails extends Project {
  project_members: ProjectMemberWithProfile[];
  project_invitations: ProjectInvitationWithProfile[];
  tasks: Task[];
  external_integrations: ExternalIntegration[];
  project_metrics: ProjectMetrics[];
}

// Response types
export interface ProjectResponse extends ActionResponse<ProjectWithDetails> {}
export interface ProjectListResponse
  extends ActionResponse<ProjectWithDetails[]> {}
