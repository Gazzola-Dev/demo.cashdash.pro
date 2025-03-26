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
import { KeyboardEvent, useCallback, useEffect, useState } from "react";

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

export function useContractDetailsForm(
  contract: Contract | null | undefined,
  isAdmin: boolean,
  isProjectManager: boolean,
  updateContract: (contractId: string, updates: Partial<Contract>) => void,
  isPending: boolean,
) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const canEdit = isAdmin || isProjectManager;

  const [formData, setFormData] = useState({
    title: contract?.title || "",
    description: contract?.description || "",
    total_amount_cents: contract?.total_amount_cents || 0,
    client_name: contract?.client_name || "",
    client_company: contract?.client_company || "",
    start_date: contract?.start_date
      ? new Date(contract.start_date).toISOString().split("T")[0]
      : "",
  });

  // Update form data when contract changes
  useEffect(() => {
    if (contract) {
      setFormData({
        title: contract.title || "",
        description: contract.description || "",
        total_amount_cents: contract.total_amount_cents || 0,
        client_name: contract.client_name || "",
        client_company: contract.client_company || "",
        start_date: contract.start_date
          ? new Date(contract.start_date).toISOString().split("T")[0]
          : "",
      });
    }
  }, [contract]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "total_amount_cents" ? parseInt(value) * 100 : value,
    }));
  };

  const handleSaveField = (fieldName: string) => {
    if (!contract || !canEdit) return;

    // Only update if the field has changed
    let updates: Partial<Contract> = {};
    let hasChanged = false;

    switch (fieldName) {
      case "title":
        if (formData.title !== contract.title) {
          updates.title = formData.title;
          hasChanged = true;
        }
        break;
      case "description":
        if (formData.description !== contract.description) {
          updates.description = formData.description;
          hasChanged = true;
        }
        break;
      case "total_amount_cents":
        if (formData.total_amount_cents !== contract.total_amount_cents) {
          updates.total_amount_cents = formData.total_amount_cents;
          hasChanged = true;
        }
        break;
      case "client_name":
        if (formData.client_name !== contract.client_name) {
          updates.client_name = formData.client_name;
          hasChanged = true;
        }
        break;
      case "client_company":
        if (formData.client_company !== contract.client_company) {
          updates.client_company = formData.client_company;
          hasChanged = true;
        }
        break;
      case "start_date":
        if (formData.start_date) {
          const currentDate = contract.start_date
            ? new Date(contract.start_date).toISOString().split("T")[0]
            : "";

          if (formData.start_date !== currentDate) {
            updates.start_date = new Date(formData.start_date).toISOString();
            hasChanged = true;
          }
        }
        break;
    }

    if (hasChanged && contract.id) {
      // Call the API to update the contract
      updateContract(contract.id, updates);
    }

    setEditingField(null);
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    fieldName: string,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveField(fieldName);
    } else if (e.key === "Escape") {
      setEditingField(null);
      // Reset form data to current contract values
      if (contract) {
        switch (fieldName) {
          case "title":
            setFormData(prev => ({ ...prev, title: contract.title || "" }));
            break;
          case "description":
            setFormData(prev => ({
              ...prev,
              description: contract.description || "",
            }));
            break;
          case "total_amount_cents":
            setFormData(prev => ({
              ...prev,
              total_amount_cents: contract.total_amount_cents || 0,
            }));
            break;
          case "client_name":
            setFormData(prev => ({
              ...prev,
              client_name: contract.client_name || "",
            }));
            break;
          case "client_company":
            setFormData(prev => ({
              ...prev,
              client_company: contract.client_company || "",
            }));
            break;
          case "start_date":
            setFormData(prev => ({
              ...prev,
              start_date: contract.start_date
                ? new Date(contract.start_date).toISOString().split("T")[0]
                : "",
            }));
            break;
        }
      }
    }
  };

  const handleBlur = (fieldName: string) => {
    handleSaveField(fieldName);
  };

  return {
    editingField,
    setEditingField,
    formData,
    handleChange,
    handleSaveField,
    handleKeyDown,
    handleBlur,
    canEdit,
    isPending,
  };
}

export function useContractRole() {
  const { contract, user, isAdmin } = useAppData();

  // Check if user is a project manager or admin in the contract
  const isProjectManager =
    isAdmin ||
    (user &&
      contract?.members?.some(
        member =>
          member.id === user.id &&
          (member.role === "project manager" || member.role === "admin"),
      )) ||
    false;

  // User can edit if they are an admin or project manager
  const canEdit = isAdmin || isProjectManager;

  return {
    isProjectManager,
    canEdit,
  };
}

interface ContractInfo {
  id: string;
  title: string;
  price: number;
  project_id: string;
  startDate: Date;
  tasks: {
    id: string;
    ordinal_id: number;
    title: string;
    description: string | null;
  }[];
  members: ContractMember[];
}

export function useContractPayment(
  allMembers: ContractMember[],
  isProjectManager: boolean,
  allPMsApproved: boolean,
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  // Check if all project managers have approved
  const projectManagers = allMembers.filter(
    member => member.role === "project manager" || member.role === "admin",
  );

  const getPendingPMNames = () => {
    const pendingPMs = projectManagers.filter(pm => !pm.hasApproved);
    return pendingPMs.map(pm => pm.display_name || "Unnamed User").join(", ");
  };

  const handleShowPaymentForm = () => {
    // Only allow project managers to show the payment form
    if (isProjectManager) {
      setShowForm(true);
    }
  };

  const handleProcessPayment = () => {
    // Only allow project managers to process payment
    if (!isProjectManager) return;

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
      setPaymentDate(new Date());
      setShowForm(false);
    }, 2000);
  };

  const canInitiatePayment = isProjectManager && allPMsApproved;

  return {
    isProcessing,
    isPaid,
    paymentDate,
    showForm,
    cardNumber,
    setCardNumber,
    cardExpiry,
    setCardExpiry,
    cardCvc,
    setCardCvc,
    cardName,
    setCardName,
    getPendingPMNames,
    handleShowPaymentForm,
    handleProcessPayment,
    canInitiatePayment,
  };
}

export function useContractMembers(
  toggleContractMember: (
    contractId: string,
    memberId: string,
    isIncluded: boolean,
  ) => void,
  isTogglePending: boolean,
  updateContractMemberApproval: (
    contractId: string,
    memberId: string,
    approved: boolean,
  ) => void,
  isApprovalPending: boolean,
) {
  // Get data from the app store
  const { contract, user, project } = useAppData();
  const { isProjectManager, canEdit } = useContractRole();

  // All project members that could be part of the contract
  const projectMembers = project?.project_members || [];
  // Current contract members
  const contractMembers = contract?.members || [];

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };

  // Check if a member is the current user
  const isCurrentUser = (memberId: string) => {
    return memberId === user?.id;
  };

  // Check if a project member is already part of the contract
  const isContractMember = (memberId: string) => {
    return contractMembers.some(member => member.id === memberId);
  };

  // Find a contract member's approval status
  const getMemberApprovalStatus = (memberId: string) => {
    const member = contractMembers.find(member => member.id === memberId);
    return member?.hasApproved || false;
  };

  // Handle toggling member inclusion in contract
  const handleToggleMember = useCallback(
    (memberId: string, checked: boolean) => {
      // Only allow project managers to toggle members
      if (!contract?.id || !isProjectManager) return;
      toggleContractMember(contract.id, memberId, checked);
    },
    [contract?.id, toggleContractMember, isProjectManager],
  );

  // Handle toggling approval status for current user
  const handleToggleApproval = useCallback(
    (memberId: string, approved: boolean) => {
      if (!contract?.id) return;
      updateContractMemberApproval(contract.id, memberId, approved);
    },
    [contract?.id, updateContractMemberApproval],
  );

  return {
    contract,
    projectMembers,
    contractMembers,
    getInitials,
    isCurrentUser,
    isContractMember,
    getMemberApprovalStatus,
    handleToggleMember,
    handleToggleApproval,
    isProjectManager,
    canEdit,
    isTogglePending,
    isApprovalPending,
  };
}

type Task = Tables<"tasks">;

export function useContractTasks(
  tasks: Partial<Task>[],
  updateTask: (taskId: string, updates: Partial<Task>) => void,
  createTask: () => void,
  isCreating: boolean,
) {
  const { project } = useAppData();
  const { isProjectManager, canEdit } = useContractRole();

  // State for task being edited
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState<string>("");
  const [editedDescription, setEditedDescription] = useState<string>("");

  // Handle edit start
  const handleStartEdit = (taskId: string, field: string, value: string) => {
    // Only allow editing if the user is a project manager
    if (!canEdit) return;

    setEditingTaskId(taskId);
    setEditingField(field);

    if (field === "title") {
      setEditedTitle(value);
    } else if (field === "description") {
      setEditedDescription(value || "");
    }
  };

  // Handle saving changes with optimistic update
  const handleSave = (taskId: string, field: string) => {
    if (!canEdit) return;

    const updates: Partial<Task> = {};

    if (field === "title" && editedTitle.trim()) {
      updates.title = editedTitle.trim();
    } else if (field === "description") {
      updates.description = editedDescription.trim();
    }

    if (Object.keys(updates).length > 0) {
      // Call API to update - the hook handles optimistic updates
      updateTask(taskId, updates);
    }

    // Reset editing state
    setEditingTaskId(null);
    setEditingField(null);
  };

  // Handle key events
  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    taskId: string,
    field: string,
  ) => {
    if (e.key === "Enter" && field === "title") {
      e.preventDefault();
      handleSave(taskId, field);
    } else if (e.key === "Escape") {
      setEditingTaskId(null);
      setEditingField(null);
    }
  };

  // Create new task
  const handleCreateTask = () => {
    if (!project || !isProjectManager) {
      return;
    }

    // Call the createTask function from the hook
    createTask();
  };

  return {
    editingTaskId,
    editingField,
    editedTitle,
    setEditedTitle,
    editedDescription,
    setEditedDescription,
    handleStartEdit,
    handleSave,
    handleKeyDown,
    handleCreateTask,
    isCreating,
    canEdit,
    isProjectManager,
  };
}
