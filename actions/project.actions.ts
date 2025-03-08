"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import { Tables } from "@/types/database.types";

type Project = Tables<"projects">;

export const createProjectAction = async (): Promise<
  ActionResponse<Project>
> => {
  const actionName = "createProjectAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) throw new Error("Not authenticated");

    // Create a default project name and description
    const defaultProjectData = {
      name: "New Project",
      description: "",
      prefix: "PRJ", // Default prefix
    };

    // Call the create_project_with_owner function
    const { data, error } = await supabase.rpc("create_project_with_owner", {
      p_name: defaultProjectData.name,
      p_description: defaultProjectData.description,
      p_prefix: defaultProjectData.prefix,
      p_slug: "", // Let the backend generate the slug
      p_owner_id: user.id,
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;
    return getActionResponse({ data: data as Project });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const deleteProjectAction = async (
  projectId: string,
): Promise<ActionResponse<boolean>> => {
  const actionName = "deleteProjectAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) throw new Error("Not authenticated");

    // Verify the user has owner permissions for this project
    const { data: memberData, error: memberError } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .single();

    if (memberError) throw new Error("Failed to verify project permissions");

    if (memberData.role !== "owner") {
      throw new Error("Only project owners can delete projects");
    }

    // Delete the project - the RLS policies will verify the user is the owner
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    conditionalLog(actionName, { error }, true);

    if (error) throw error;
    return getActionResponse({ data: true });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
