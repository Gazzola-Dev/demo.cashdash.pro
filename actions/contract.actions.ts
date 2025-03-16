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

    // Use the RPC function to update the contract
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

    // Use the database function to get contract with members

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

export const toggleContractMemberAction = async (
  contractId: string,
  userId: string,
  isIncluded: boolean,
): Promise<ActionResponse<ContractWithMembers>> => {
  const actionName = "toggleContractMemberAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    let data;
    let error;

    if (isIncluded) {
      // Add user to contract members
      ({ data, error } = await supabase.rpc("add_contract_member", {
        p_contract_id: contractId,
        p_user_id: userId,
        p_role: "member", // Default role
      }));
    } else {
      // Remove user from contract members
      ({ data, error } = await supabase.rpc("remove_contract_member", {
        p_contract_id: contractId,
        p_user_id: userId,
      }));
    }

    conditionalLog(actionName, { data, error }, true, null);

    if (error) throw error;

    // Get the updated contract with members
    const { data: updatedContract, error: getError } = await supabase.rpc(
      "get_contract_by_id",
      { p_contract_id: contractId },
    );

    if (getError) throw getError;

    const typedData = updatedContract as any as {
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
    conditionalLog(actionName, { error }, true, null);
    return getActionResponse({ error });
  }
};

export const updateContractMemberApprovalAction = async (
  contractId: string,
  userId: string,
  approved: boolean,
): Promise<ActionResponse<ContractWithMembers>> => {
  const actionName = "updateContractMemberApprovalAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    // Update contract member approval status
    const { data, error } = await supabase.rpc(
      "update_contract_member_approval",
      {
        p_contract_id: contractId,
        p_user_id: userId,
        p_approved: approved,
      },
    );

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;

    // Get the updated contract with members
    const { data: updatedContract, error: getError } = await supabase.rpc(
      "get_contract_by_id",
      { p_contract_id: contractId },
    );

    if (getError) throw getError;

    const typedData = updatedContract as any as {
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
