import { Tables } from "@/types/database.types";

type Project = Tables<"projects">;
type Profile = Tables<"profiles">;
type ProjectInvitation = Tables<"project_invitations">;

export interface ProjectInviteDetails extends ProjectInvitation {
  project: Pick<Project, "id" | "name" | "slug" | "prefix" | "status">;
  inviter: Pick<
    Profile,
    "id" | "display_name" | "avatar_url" | "professional_title" | "email"
  >;
}

export interface UserInvites {
  invitations: ProjectInviteDetails[];
}
