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

    conditionalLog(actionName, { data, error }, true, null);

    if (error) throw error;
    return getActionResponse({ data: data as Project });
  } catch (error) {
    conditionalLog(actionName, { error }, true, null);
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

    // Use the new delete_project RPC function which handles permissions and deletion
    const { data, error } = await supabase.rpc("delete_project", {
      p_project_id: projectId,
      p_user_id: user.id,
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;

    // If delete_project returns false, it means user doesn't have permission
    if (!data) {
      throw new Error("Only project owners can delete projects");
    }

    return getActionResponse({ data: true });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
