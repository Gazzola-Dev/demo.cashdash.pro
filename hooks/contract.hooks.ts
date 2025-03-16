import {
  getContractByMilestoneAction,
  toggleContractMemberAction,
  updateContractAction,
  updateContractMemberApprovalAction,
} from "@/actions/contract.actions";
import { useToast } from "@/hooks/use-toast";
import { conditionalLog } from "@/lib/log.utils";
import { useAppData } from "@/stores/app.store";
import { ContractMember, ContractWithMembers } from "@/types/app.types";
import { Tables } from "@/types/database.types";
import {
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useState } from "react";

type Contract = Tables<"contracts">;

interface QueryConfig<TData>
  extends Omit<UseQueryOptions<TData, Error>, "queryKey" | "queryFn"> {}

export const useGetContractByMilestone = (
  milestoneId?: string,
  config?: QueryConfig<ContractWithMembers | null>,
) => {
  const { setContract } = useAppData();
  const hookName = "useGetContractByMilestone";

  return useQuery({
    queryKey: ["contract", milestoneId],
    queryFn: async () => {
      if (!milestoneId) return null;

      const { data, error } = await getContractByMilestoneAction(milestoneId);
      conditionalLog(hookName, { data, error }, false);
      setContract(data);

      if (error) throw new Error(error);
      return data;
    },
    enabled: !!milestoneId,
    staleTime: 1000 * 60, // 1 minute
    ...config,
  });
};

export const useUpdateContract = () => {
  const hookName = "useUpdateContract";
  const { toast } = useToast();
  const [prevState, setPrevState] = useState<ContractWithMembers | null>(null);
  const queryClient = useQueryClient();
  const { contract, setContract } = useAppData();

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      contractId,
      updates,
    }: {
      contractId: string;
      updates: Partial<Contract>;
    }) => {
      conditionalLog(hookName, { contractId, updates }, false);

      // Make the API call
      const { data, error } = await updateContractAction(contractId, updates);
      conditionalLog(hookName, { data, error }, false);

      if (error) throw new Error(error);
      return data;
    },
    onMutate: async ({ contractId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["contract", contractId],
      });

      // Save the previous contract state
      const previousContract = queryClient.getQueryData([
        "contract",
        contractId,
      ]);
      setPrevState(previousContract as ContractWithMembers | null);

      // Optimistically update the contract in query cache
      queryClient.setQueryData(
        ["contract", contractId],
        (old: ContractWithMembers | null) => {
          if (!old) return null;
          return {
            ...old,
            ...updates,
          };
        },
      );

      // Also update the contract in app store for immediate UI reflection
      if (contract && contract.id === contractId) {
        setContract({
          ...contract,
          ...updates,
        });
      }

      return { previousContract };
    },
    onSuccess: data => {
      toast({
        title: "Contract updated",
        description: "Contract has been successfully updated.",
      });

      // Update the contract in the app store with the response from the server
      if (data) {
        const updatedContract = {
          ...contract,
          ...data,
          members: data.members || [],
        };

        setContract(updatedContract);
      }

      // Invalidate relevant queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ["contract", data?.id],
      });
    },
    onError: (error, _, context) => {
      // Restore previous state if needed
      if (context?.previousContract) {
        queryClient.setQueryData(
          ["contract", (context.previousContract as ContractWithMembers).id],
          context.previousContract,
        );

        // Also restore the app store state
        if (prevState) {
          setContract(prevState);
        }
      }

      toast({
        title: "Failed to update contract",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateContract = useCallback(
    (contractId: string, updates: Partial<Contract>) => {
      // Store current state for potential rollback
      const currentContract = queryClient.getQueryData([
        "contract",
        contractId,
      ]) as ContractWithMembers | null;

      if (currentContract) {
        setPrevState(currentContract);
      }

      mutate({ contractId, updates });
    },
    [mutate, queryClient],
  );

  return {
    updateContract,
    isPending,
  };
};

export const useToggleContractMember = () => {
  const hookName = "useToggleContractMember";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { contract, setContract, project } = useAppData();

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      contractId,
      userId,
      isIncluded,
    }: {
      contractId: string;
      userId: string;
      isIncluded: boolean;
    }) => {
      conditionalLog(hookName, { contractId, userId, isIncluded }, false, null);

      // Make the API call
      const { data, error } = await toggleContractMemberAction(
        contractId,
        userId,
        isIncluded,
      );
      conditionalLog(hookName, { data, error }, false, null);

      if (error) throw new Error(error);
      return data;
    },
    onMutate: async ({ contractId, userId, isIncluded }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["contract", contractId],
      });

      // Save the previous contract state
      const previousContract = queryClient.getQueryData([
        "contract",
        contractId,
      ]) as ContractWithMembers | null;

      // Optimistically update the contract in app store
      if (contract && contract.id === contractId) {
        let updatedMembers;

        if (isIncluded) {
          // Find user info from project members if possible
          const userProfile = project?.project_members?.find(
            member => member.user_id === userId,
          )?.profile;

          // Create a properly typed ContractMember object
          const newMember: ContractMember = {
            id: userId,
            hasApproved: false,
            display_name: userProfile?.display_name || null,
            email: userProfile?.email || "unknown@example.com", // Fallback value
            avatar_url: userProfile?.avatar_url || null,
            role: "member", // Default role
          };

          updatedMembers = [...(contract.members || []), newMember];
        } else {
          // Remove user from contract members
          updatedMembers = (contract.members || []).filter(
            member => member.id !== userId,
          );
        }

        const updatedContract = {
          ...contract,
          members: updatedMembers,
        };

        setContract(updatedContract);

        // Also update the query cache
        queryClient.setQueryData(["contract", contractId], updatedContract);
      }

      return { previousContract };
    },
    onSuccess: data => {
      toast({
        title: "Contract members updated",
        description: "Contract member list has been updated successfully.",
      });

      // Update with server response
      if (data && contract) {
        setContract({
          ...contract,
          members: data.members || [],
        });
      }

      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ["contract", contract?.id],
      });
    },
    onError: (error, { contractId }, context) => {
      // Restore previous state
      if (context?.previousContract) {
        queryClient.setQueryData(
          ["contract", contractId],
          context.previousContract,
        );

        // Also restore app store state
        if (context.previousContract) {
          setContract(context.previousContract);
        }
      }

      toast({
        title: "Failed to update contract members",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleContractMember = useCallback(
    (contractId: string, userId: string, isIncluded: boolean) => {
      mutate({ contractId, userId, isIncluded });
    },
    [mutate],
  );

  return {
    toggleContractMember,
    isPending,
  };
};

export const useUpdateContractMemberApproval = () => {
  const hookName = "useUpdateContractMemberApproval";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { contract, setContract } = useAppData();

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      contractId,
      userId,
      approved,
    }: {
      contractId: string;
      userId: string;
      approved: boolean;
    }) => {
      conditionalLog(hookName, { contractId, userId, approved }, false);

      // Make the API call
      const { data, error } = await updateContractMemberApprovalAction(
        contractId,
        userId,
        approved,
      );
      conditionalLog(hookName, { data, error }, false);

      if (error) throw new Error(error);
      return data;
    },
    onMutate: async ({ contractId, userId, approved }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["contract", contractId],
      });

      // Save the previous contract state
      const previousContract = queryClient.getQueryData([
        "contract",
        contractId,
      ]) as ContractWithMembers | null;

      // Optimistically update the contract in app store
      if (contract && contract.id === contractId) {
        const updatedMembers = (contract.members || []).map(member =>
          member.id === userId ? { ...member, hasApproved: approved } : member,
        );

        const updatedContract = {
          ...contract,
          members: updatedMembers,
        };

        setContract(updatedContract);

        // Also update the query cache
        queryClient.setQueryData(["contract", contractId], updatedContract);
      }

      return { previousContract };
    },
    onSuccess: data => {
      toast({
        title: "Contract approval updated",
        description: "Contract approval status has been updated successfully.",
      });

      // Update with server response
      if (data && contract) {
        setContract({
          ...contract,
          members: data.members || [],
        });
      }

      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ["contract", contract?.id],
      });
    },
    onError: (error, { contractId }, context) => {
      // Restore previous state
      if (context?.previousContract) {
        queryClient.setQueryData(
          ["contract", contractId],
          context.previousContract,
        );

        // Also restore app store state
        if (context.previousContract) {
          setContract(context.previousContract);
        }
      }

      toast({
        title: "Failed to update approval status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateContractMemberApproval = useCallback(
    (contractId: string, userId: string, approved: boolean) => {
      mutate({ contractId, userId, approved });
    },
    [mutate],
  );

  return {
    updateContractMemberApproval,
    isPending,
  };
};
