import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/stores/app.store";
import { ContractMember, ContractWithMembers } from "@/types/app.types";
import { Tables } from "@/types/database.types";
import { KeyboardEvent, useCallback, useEffect, useState } from "react";

type Contract = Tables<"contracts">;

/**
 * Hook for getting a contract by ID
 */
export const useGetContractById = () => {
  const { contract, setContract, project } = useAppData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContractById = useCallback(
    (contractId: string) => {
      if (!contractId) {
        setContract(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check if we already have the contract loaded
        if (contract && contract.id === contractId) {
          setIsLoading(false);
          return;
        }

        // Find the contract from project data if available
        if (project && project.id) {
          // This is a mock implementation that assumes contracts would be available
          // through the project relationship in a real implementation
          const foundContract: Partial<ContractWithMembers> = {
            id: contractId,
            title: `Contract for ${project.name || "Project"}`,
            description: "Project contract details",
            project_id: project.id,
            total_amount_cents: 0,
            created_at: new Date().toISOString(),
            client_name: "",
            client_company: "",
            start_date: new Date().toISOString(),
            members: [],
            payments: [],
          };

          setContract(foundContract);
        } else {
          setError("Could not find associated project");
        }
      } catch (err) {
        setError("Failed to load contract");
        console.error("Error loading contract:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [contract, setContract, project],
  );

  return {
    data: contract,
    isLoading,
    error,
    getContractById,
  };
};

/**
 * Hook for getting a contract by milestone
 */
export const useGetContractByMilestone = () => {
  const { contract, setContract, milestone, project } = useAppData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContractByMilestone = useCallback(
    (milestoneId: string) => {
      if (!milestoneId) {
        setContract(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check if we have the milestone data
        if (milestone && milestone.id === milestoneId) {
          // In a real implementation, you would fetch the contract associated with this milestone
          // For now, we'll create a mock contract based on the milestone data
          const contractData: Partial<ContractWithMembers> = {
            id: `contract-${milestoneId}`,
            title: `Contract for ${milestone.title || "Milestone"}`,
            description: milestone.description || "Contract details",
            project_id: project?.id || "",
            milestone_reference_id: milestoneId, // Use milestone_reference_id instead of milestone_id
            total_amount_cents: 0,
            created_at: new Date().toISOString(),
            client_name: "",
            client_company: "",
            start_date: milestone.start_date || new Date().toISOString(),
            members: [],
            payments: [],
          };

          // Update contract directly in app store instead of local state
          setContract(contractData);
        } else {
          setError("Could not find associated milestone");
        }
      } catch (err) {
        setError("Failed to load contract for milestone");
        console.error("Error loading contract by milestone:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [milestone, setContract, project],
  );

  return {
    data: contract, // Use contract directly from app store
    isLoading,
    error,
    getContractByMilestone,
  };
};

/**
 * Hook to update a contract
 */
export const useUpdateContract = () => {
  const { toast } = useToast();
  const { contract, setContract } = useAppData();
  const [prevState, setPrevState] =
    useState<Partial<ContractWithMembers> | null>(null);
  const [isPending, setIsPending] = useState(false);

  const updateContract = useCallback(
    (contractId: string, updates: Partial<Contract>) => {
      if (!contract || contract.id !== contractId) return;

      // Store current state for potential rollback
      setPrevState({ ...contract });

      setIsPending(true);
      try {
        // Optimistically update the contract in state
        const updatedContract = {
          ...contract,
          ...updates,
          updated_at: new Date().toISOString(),
        };

        setContract(updatedContract);

        toast({
          title: "Contract updated",
          description: "Contract has been successfully updated.",
        });
      } catch (error) {
        console.error("Error updating contract:", error);

        // Restore previous state on error
        if (prevState) {
          setContract(prevState);
        }

        toast({
          title: "Update failed",
          description: "Failed to update contract. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsPending(false);
      }
    },
    [contract, setContract, toast, prevState],
  );

  return {
    updateContract,
    isPending,
  };
};

/**
 * Hook to toggle contract member
 */
export const useToggleContractMember = () => {
  const { toast } = useToast();
  const { contract, setContract, project } = useAppData();
  const [prevState, setPrevState] =
    useState<Partial<ContractWithMembers> | null>(null);
  const [isPending, setIsPending] = useState(false);

  const toggleContractMember = useCallback(
    (contractId: string, userId: string, isIncluded: boolean) => {
      if (!contract || contract.id !== contractId) return;

      // Store current state for potential rollback
      setPrevState({ ...contract });

      setIsPending(true);
      try {
        let updatedMembers;

        if (isIncluded) {
          // Find user info from project members if possible
          const userProfile = project?.project_members?.find(
            member => member.user_id === userId,
          )?.profile;

          // Create a properly typed ContractMember object
          const newMember: ContractMember = {
            id: userId,
            display_name: userProfile?.display_name || null,
            email: userProfile?.email || "unknown@example.com",
            avatar_url: userProfile?.avatar_url || null,
            role: "developer",
            hasApproved: false,
          };

          updatedMembers = [...(contract.members || []), newMember];
        } else {
          // Remove user from contract members
          updatedMembers = (contract.members || []).filter(
            member => member.id !== userId,
          );
        }

        // Optimistically update the UI
        setContract({
          ...contract,
          members: updatedMembers,
          updated_at: new Date().toISOString(),
        });

        toast({
          title: "Contract members updated",
          description: "Contract member list has been updated successfully.",
        });
      } catch (error) {
        console.error("Error toggling contract member:", error);

        // Restore previous state on error
        if (prevState) {
          setContract(prevState);
        }

        toast({
          title: "Update failed",
          description: "Failed to update contract members. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsPending(false);
      }
    },
    [contract, setContract, project?.project_members, toast, prevState],
  );

  return {
    toggleContractMember,
    isPending,
  };
};

/**
 * Hook to update contract member approval
 */
export const useUpdateContractMemberApproval = () => {
  const { toast } = useToast();
  const { contract, setContract } = useAppData();
  const [prevState, setPrevState] =
    useState<Partial<ContractWithMembers> | null>(null);
  const [isPending, setIsPending] = useState(false);

  const updateContractMemberApproval = useCallback(
    (contractId: string, userId: string, approved: boolean) => {
      if (!contract || contract.id !== contractId) return;

      // Store current state for potential rollback
      setPrevState({ ...contract });

      setIsPending(true);
      try {
        const updatedMembers = (contract.members || []).map(member =>
          member.id === userId ? { ...member, hasApproved: approved } : member,
        );

        // Optimistically update the UI
        setContract({
          ...contract,
          members: updatedMembers,
          updated_at: new Date().toISOString(),
        });

        toast({
          title: "Contract approval updated",
          description:
            "Contract approval status has been updated successfully.",
        });
      } catch (error) {
        console.error("Error updating contract member approval:", error);

        // Restore previous state on error
        if (prevState) {
          setContract(prevState);
        }

        toast({
          title: "Update failed",
          description: "Failed to update approval status. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsPending(false);
      }
    },
    [contract, setContract, toast, prevState],
  );

  return {
    updateContractMemberApproval,
    isPending,
  };
};

/**
 * Hook for contract details form
 */
export function useContractDetailsForm() {
  const { toast } = useToast();
  const { contract, setContract, isAdmin } = useAppData();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [prevState, setPrevState] = useState<Partial<Contract> | null>(null);

  // Check if user is a project manager or admin in the contract
  const { user } = useAppData();
  const isProjectManager =
    isAdmin ||
    (user &&
      contract?.members?.some(
        member =>
          member.id === user.id &&
          (member.role === "project_manager" || member.role === "admin"),
      )) ||
    false;

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

  const updateContract = useCallback(
    (contractId: string, updates: Partial<Contract>) => {
      if (!contract) return;

      // Store current state for potential rollback
      setPrevState({ ...contract });

      setIsPending(true);
      try {
        // Optimistically update the contract in state
        const updatedContract = {
          ...contract,
          ...updates,
          updated_at: new Date().toISOString(),
        };

        setContract(updatedContract);

        toast({
          title: "Contract updated",
          description: "Contract has been successfully updated.",
        });
      } catch (error) {
        console.error("Error updating contract:", error);

        // Restore previous state on error
        if (prevState) {
          setContract({
            ...contract,
            ...prevState,
          });
        }

        toast({
          title: "Update failed",
          description: "Failed to update contract. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsPending(false);
      }
    },
    [contract, setContract, toast, prevState],
  );

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

/**
 * Hook for contract role
 */
export function useContractRole() {
  const { contract, user, isAdmin } = useAppData();

  // Check if user is a project manager or admin in the contract
  const isProjectManager =
    isAdmin ||
    (user &&
      contract?.members?.some(
        member =>
          member.id === user.id &&
          (member.role === "project_manager" || member.role === "admin"),
      )) ||
    false;

  // User can edit if they are an admin or project manager
  const canEdit = isAdmin || isProjectManager;

  return {
    isProjectManager,
    canEdit,
  };
}

/**
 * Hook for contract payment
 */
/**
 * Hook for contract payment
 */
export function useContractPayment() {
  const { contract, setContract } = useAppData();
  const { isProjectManager } = useContractRole();
  const { toast } = useToast();

  const [isPending, setIsPending] = useState(false);

  // Check if contract has been paid
  const isPaid =
    contract?.payments?.some(
      payment =>
        payment.status === "completed" || payment.status === "confirmed",
    ) || false;

  // Get payment data if available
  const paymentData =
    isPaid && contract?.payments
      ? contract.payments.find(
          payment =>
            payment.status === "completed" || payment.status === "confirmed",
        )
      : null;

  // Check if all members have approved
  const allMembersApproved =
    contract?.members?.every(member => member.hasApproved) || false;

  // Get names of members who haven't approved
  const getPendingMemberNames = () => {
    const pendingMembers =
      contract?.members?.filter(member => !member.hasApproved) || [];
    return pendingMembers
      .map(member => member.display_name || "Unnamed User")
      .join(", ");
  };

  const handleProcessPayment = useCallback(() => {
    if (!isProjectManager || !contract || !contract.id) return;

    setIsPending(true);

    try {
      // Generate transaction ID
      const transactionId = `txn_${Math.random().toString(36).substring(2, 15)}`;

      // Create new payment with all required fields
      const newPayment = {
        id: `payment-${Date.now()}`,
        contract_id: contract.id,
        amount_cents: contract.total_amount_cents || 0,
        status: "confirmed", // Set as confirmed immediately
        payment_date: new Date().toISOString(), // Use current date
        transaction_id: transactionId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        milestone_id: contract.milestone_reference_id || null,
      };

      // Update contract with new payment and status
      setContract({
        ...contract,
        payments: [...(contract.payments || []), newPayment],
        status: "completed",
      });

      toast({
        title: "Payment processed successfully",
        description: "The contract payment has been processed.",
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Payment failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  }, [contract, isProjectManager, setContract, toast]);

  return {
    contract,
    isProjectManager,
    isPaid,
    paymentData,
    allMembersApproved,
    getPendingMemberNames,
    handleProcessPayment,
    isPending,
  };
}

/**
 * Hook for contract members
 */
export function useContractMembers() {
  // Get data from the app store
  const { contract, user, project } = useAppData();
  const { toggleContractMember, isPending: isTogglePending } =
    useToggleContractMember();
  const { updateContractMemberApproval, isPending: isApprovalPending } =
    useUpdateContractMemberApproval();

  // Check if user has project manager role
  const { isProjectManager } = useContractRole();

  // All project members that could be part of the contract
  const projectMembers = project?.project_members || [];

  // Helper to get initials for avatar fallback
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
    return contract?.members?.some(member => member.id === memberId) || false;
  };

  // Find a contract member's approval status
  const getMemberApprovalStatus = (memberId: string) => {
    const member = contract?.members?.find(member => member.id === memberId);
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

  // Handle toggling approval status - now any user can toggle their own approval
  const handleToggleApproval = useCallback(
    (memberId: string, approved: boolean) => {
      // Only allow users to toggle their own approval status
      if (!contract?.id || (memberId !== user?.id && !isProjectManager)) return;
      updateContractMemberApproval(contract.id, memberId, approved);
    },
    [contract?.id, updateContractMemberApproval, user?.id, isProjectManager],
  );

  return {
    contract,
    projectMembers,
    getInitials,
    isCurrentUser,
    isContractMember,
    getMemberApprovalStatus,
    handleToggleMember,
    handleToggleApproval,
    isProjectManager,
    isTogglePending,
    isApprovalPending,
  };
}

/**
 * Hook for contract tasks
 */
export function useContractTasks(
  tasks: Partial<Tables<"tasks">>[],
  updateTask: (taskId: string, updates: Partial<Tables<"tasks">>) => void,
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

    const updates: Partial<Tables<"tasks">> = {};

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

/**
 * Hook for managing contracts
 */
/**
 * Hook for managing contracts
 */
export function useContract() {
  const { contract, setContract, milestone } = useAppData();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  // Update contract details
  const updateContract = useCallback(
    (updates: Partial<Contract>) => {
      if (!contract) return null;

      setIsPending(true);
      try {
        // Create updated contract
        const updatedContract: Partial<ContractWithMembers> = {
          ...contract,
          ...updates,
          updated_at: new Date().toISOString(),
        };

        // Update the contract in state - setContract will also update the milestone's contract
        // if applicable, thanks to our enhanced store
        setContract(updatedContract);

        toast({
          title: "Contract updated",
          description: "Contract has been successfully updated.",
        });

        return updatedContract;
      } catch (error) {
        console.error("Error updating contract:", error);
        toast({
          title: "Update failed",
          description: "Failed to update contract. Please try again.",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [contract, setContract, toast],
  );

  // Create a new contract
  const createContract = useCallback(() => {
    if (!milestone) {
      toast({
        title: "No milestone selected",
        description: "Please select a milestone first.",
        variant: "destructive",
      });
      return null;
    }

    setIsPending(true);
    try {
      // Create a new contract with milestone_reference_id instead of milestone_id
      const newContract: Partial<ContractWithMembers> = {
        id: `contract-${Date.now()}`,
        milestone_reference_id: milestone.id, // Use milestone_reference_id instead of milestone_id
        project_id: milestone.project_id,
        title: `Contract for ${milestone.title || "Milestone"}`,
        description: "",
        status: "draft" as Tables<"contracts">["status"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_amount_cents: 0,
        currency: "USD",
        members: [],
        payments: [],
      };

      // Set the contract - this will also update the milestone if applicable
      setContract(newContract);

      toast({
        title: "Contract created",
        description: "New contract has been created successfully.",
      });

      return newContract;
    } catch (error) {
      console.error("Error creating contract:", error);
      toast({
        title: "Creation failed",
        description: "Failed to create contract. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsPending(false);
    }
  }, [milestone, setContract, toast]);

  // Add a member to the contract
  const addContractMember = useCallback(
    (member: Partial<ContractWithMembers["members"][0]>) => {
      if (!contract) return null;

      setIsPending(true);
      try {
        // Add member to the contract
        const updatedContract: Partial<ContractWithMembers> = {
          ...contract,
          members: [...(contract.members || []), member],
          updated_at: new Date().toISOString(),
        };

        // Update the contract in state
        setContract(updatedContract);

        toast({
          title: "Member added",
          description: "Member has been added to the contract.",
        });

        return updatedContract;
      } catch (error) {
        console.error("Error adding contract member:", error);
        toast({
          title: "Failed to add member",
          description: "Failed to add member to contract. Please try again.",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [contract, setContract, toast],
  );

  // Remove a member from the contract
  const removeContractMember = useCallback(
    (memberId: string) => {
      if (!contract) return null;

      setIsPending(true);
      try {
        // Remove member from the contract
        const updatedContract: Partial<ContractWithMembers> = {
          ...contract,
          members: (contract.members || []).filter(m => m.id !== memberId),
          updated_at: new Date().toISOString(),
        };

        // Update the contract in state
        setContract(updatedContract);

        toast({
          title: "Member removed",
          description: "Member has been removed from the contract.",
        });

        return updatedContract;
      } catch (error) {
        console.error("Error removing contract member:", error);
        toast({
          title: "Failed to remove member",
          description:
            "Failed to remove member from contract. Please try again.",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [contract, setContract, toast],
  );

  // Add a payment to the contract
  const addContractPayment = useCallback(
    (payment: Partial<ContractWithMembers["payments"][0]>) => {
      if (!contract) return null;

      setIsPending(true);
      try {
        // Add payment to the contract
        const updatedContract: Partial<ContractWithMembers> = {
          ...contract,
          payments: [...(contract.payments || []), payment],
          updated_at: new Date().toISOString(),
        };

        // Update the contract in state
        setContract(updatedContract);

        toast({
          title: "Payment added",
          description: "Payment has been added to the contract.",
        });

        return updatedContract;
      } catch (error) {
        console.error("Error adding contract payment:", error);
        toast({
          title: "Failed to add payment",
          description: "Failed to add payment to contract. Please try again.",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [contract, setContract, toast],
  );

  // Update a payment in the contract
  const updateContractPayment = useCallback(
    (
      paymentId: string,
      updates: Partial<ContractWithMembers["payments"][0]>,
    ) => {
      if (!contract) return null;

      setIsPending(true);
      try {
        // Update payment in the contract
        const updatedPayments = (contract.payments || []).map(payment =>
          payment.id === paymentId ? { ...payment, ...updates } : payment,
        );

        const updatedContract: Partial<ContractWithMembers> = {
          ...contract,
          payments: updatedPayments,
          updated_at: new Date().toISOString(),
        };

        // Update the contract in state
        setContract(updatedContract);

        toast({
          title: "Payment updated",
          description: "Payment has been updated.",
        });

        return updatedContract;
      } catch (error) {
        console.error("Error updating contract payment:", error);
        toast({
          title: "Failed to update payment",
          description: "Failed to update payment. Please try again.",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [contract, setContract, toast],
  );

  // Remove a payment from the contract
  const removeContractPayment = useCallback(
    (paymentId: string) => {
      if (!contract) return null;

      setIsPending(true);
      try {
        // Remove payment from the contract
        const updatedContract: Partial<ContractWithMembers> = {
          ...contract,
          payments: (contract.payments || []).filter(p => p.id !== paymentId),
          updated_at: new Date().toISOString(),
        };

        // Update the contract in state
        setContract(updatedContract);

        toast({
          title: "Payment removed",
          description: "Payment has been removed from the contract.",
        });

        return updatedContract;
      } catch (error) {
        console.error("Error removing contract payment:", error);
        toast({
          title: "Failed to remove payment",
          description:
            "Failed to remove payment from contract. Please try again.",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [contract, setContract, toast],
  );

  return {
    contract,
    milestone,
    isPending,
    updateContract,
    createContract,
    addContractMember,
    removeContractMember,
    addContractPayment,
    updateContractPayment,
    removeContractPayment,
  };
}
