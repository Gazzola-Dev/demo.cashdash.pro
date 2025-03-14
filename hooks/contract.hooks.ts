"use client";

import {
  getContractByMilestoneAction,
  updateContractAction,
} from "@/actions/contract.actions";
import { useToast } from "@/hooks/use-toast";
import { conditionalLog } from "@/lib/log.utils";
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
  config?: QueryConfig<Contract | null>,
) => {
  const hookName = "useGetContractByMilestone";

  return useQuery({
    queryKey: ["contract", milestoneId],
    queryFn: async () => {
      if (!milestoneId) return null;

      const { data, error } = await getContractByMilestoneAction(milestoneId);
      conditionalLog(hookName, { data, error }, false, null);

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
  const [prevState, setPrevState] = useState<Contract | null>(null);
  const queryClient = useQueryClient();

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
      setPrevState(previousContract as Contract | null);

      // Optimistically update the contract
      queryClient.setQueryData(
        ["contract", contractId],
        (old: Contract | null) => {
          if (!old) return null;
          return { ...old, ...updates };
        },
      );

      return { previousContract };
    },
    onSuccess: data => {
      toast({
        title: "Contract updated",
        description: "Contract has been successfully updated.",
      });

      // Invalidate relevant queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ["contract", data?.id],
      });
    },
    onError: (error, _, context) => {
      // Restore previous state if needed
      if (context?.previousContract) {
        queryClient.setQueryData(
          ["contract", (context.previousContract as Contract).id],
          context.previousContract,
        );
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
      ]) as Contract | null;

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
