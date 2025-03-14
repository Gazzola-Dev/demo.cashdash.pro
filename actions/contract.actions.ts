"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import { Tables } from "@/types/database.types";

type Contract = Tables<"contracts">;

export const updateContractAction = async (
  contractId: string,
  updates: Partial<Contract>,
): Promise<ActionResponse<Contract>> => {
  const actionName = "updateContractAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    // Make the API call
    const { data, error } = await supabase
      .from("contracts")
      .update(updates)
      .eq("id", contractId)
      .select()
      .single();

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;
    return getActionResponse({ data: data as Contract });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

// Updated version in actions/contract.actions.ts
export const getContractByMilestoneAction = async (
  milestoneId: string,
): Promise<ActionResponse<Contract | null>> => {
  const actionName = "getContractByMilestoneAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    // First get the milestone to find the project_id
    const { data: milestoneData, error: milestoneError } = await supabase
      .from("milestones")
      .select("project_id")
      .eq("id", milestoneId)
      .single();

    conditionalLog(actionName, { milestoneData, milestoneError }, true);

    if (milestoneError) throw milestoneError;

    // Now find contracts for this project
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("project_id", milestoneData.project_id);

    conditionalLog(actionName, { data, error, count: data?.length }, true);

    if (error) throw error;

    // Handle cases where there might be multiple or no contracts
    if (!data || data.length === 0) {
      return getActionResponse({ data: null });
    }

    // If there are multiple contracts, return the most recently created one
    // You might want to change this logic based on your specific requirements
    const sortedContracts = data.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return getActionResponse({ data: sortedContracts[0] as Contract });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
