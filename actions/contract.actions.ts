"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import { ContractMember, ContractWithMembers } from "@/types/app.types";
import { Tables } from "@/types/database.types";

type Contract = Tables<"contracts">;

export const updateContractAction = async (
  contractId: string,
  updates: Partial<Contract>,
): Promise<ActionResponse<ContractWithMembers>> => {
  const actionName = "updateContractAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    // Use the new RPC function instead of direct update
    const { data, error } = await supabase.rpc("update_contract_with_members", {
      p_contract_id: contractId,
      p_updates: updates,
    });

    conditionalLog(actionName, { data, error }, true, null);

    if (error) throw error;
    return getActionResponse({ data: data as any as ContractWithMembers });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const getContractByMilestoneAction = async (
  milestoneId: string,
): Promise<ActionResponse<ContractWithMembers | null>> => {
  const actionName = "getContractByMilestoneAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    // Use the new database function to get contract with members
    const { data, error } = await supabase.rpc("get_contract_by_milestone", {
      p_milestone_id: milestoneId,
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;

    // If no data returned, return null
    if (!data) {
      return getActionResponse({ data: null });
    }

    const typedData = data as any as {
      contract: Contract;
      members: ContractMember[];
    };

    return getActionResponse({
      data: {
        ...typedData.contract,
        members: typedData.members,
      } as ContractWithMembers,
    });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
