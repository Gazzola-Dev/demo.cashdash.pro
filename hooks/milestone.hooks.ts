import useProjectRole from "@/hooks/member.hooks";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/stores/app.store";
import { MilestoneWithTasks } from "@/types/app.types";
import { Tables } from "@/types/database.types";
import { useCallback, useEffect, useState } from "react";

/**
 * Hook for milestone card functionality
 */

type Milestone = Tables<"milestones">;

/**
 * Hook for milestone card functionality
 */
export const useMilestoneCard = () => {
  const {
    milestone,
    setMilestone,
    setTasks,
    project,
    milestones,
    setMilestones,
    setContract,
  } = useAppData();
  const { canEdit, isAdmin } = useProjectRole();
  const { toast } = useToast();

  // State for component UI
  const [isOpen, setIsOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: milestone?.title || "",
    description: milestone?.description || "",
    status: milestone?.status || "draft",
    dueDate: milestone?.due_date
      ? new Date(milestone.due_date).toISOString().split("T")[0]
      : "",
  });

  // Calculate progress based on completed tasks
  const progress =
    milestone?.tasks_completed && milestone?.tasks_count
      ? Math.round((milestone.tasks_completed / milestone.tasks_count) * 100)
      : 0;

  // Calculate days remaining if due date exists
  const daysRemaining = milestone?.due_date
    ? Math.ceil(
        (new Date(milestone.due_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate time ago for display
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000)
      return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  // Update form data when milestone changes
  useEffect(() => {
    if (milestone) {
      setFormData({
        title: milestone.title || "",
        description: milestone.description || "",
        status: milestone.status || "draft",
        dueDate: milestone.due_date
          ? new Date(milestone.due_date).toISOString().split("T")[0]
          : "",
      });
    }
  }, [milestone]);

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle status change
  const handleStatusChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      status: value as "draft" | "active" | "completed" | "archived",
    }));
    if (milestone && canEdit) {
      handleSaveField("status");
    }
  };

  // Handle milestone change in select dropdown
  const handleMilestoneChange = useCallback(
    (milestoneId: string) => {
      if (!project || !milestoneId) return;

      setIsPending(true);

      try {
        // Find the selected milestone in the list
        const selectedMilestone = milestones.find(m => m.id === milestoneId);

        if (selectedMilestone) {
          // We'll use setMilestone from the app store which will handle updating tasks
          // and the contract associated with this milestone
          setMilestone(selectedMilestone);

          // Set form data
          setFormData({
            title: selectedMilestone.title || "",
            description: selectedMilestone.description || "",
            status: selectedMilestone.status || "draft",
            dueDate: selectedMilestone.due_date
              ? new Date(selectedMilestone.due_date).toISOString().split("T")[0]
              : "",
          });
        }
      } catch (error) {
        console.error("Error changing milestone:", error);
        toast({
          title: "Error",
          description: "Failed to change milestone",
          variant: "destructive",
        });
      } finally {
        setIsPending(false);
      }
    },
    [project, milestones, setMilestone, toast],
  );

  // Handle saving a field
  const handleSaveField = useCallback(
    (fieldName: string) => {
      if (!milestone || !canEdit) return;

      setIsPending(true);

      try {
        // Prepare the updates based on which field is being saved
        const updates: Partial<Milestone> = {};

        if (fieldName === "title") {
          updates.title = formData.title;
        } else if (fieldName === "description") {
          updates.description = formData.description;
        } else if (fieldName === "status") {
          updates.status = formData.status as Tables<"milestones">["status"];
        } else if (fieldName === "dueDate") {
          updates.due_date = formData.dueDate
            ? new Date(formData.dueDate).toISOString()
            : null;
        }

        // Update the milestone
        const updatedMilestone = {
          ...milestone,
          ...updates,
          updated_at: new Date().toISOString(),
        };

        // Update in state - this will also update the milestones collection
        // thanks to our enhanced store
        setMilestone(updatedMilestone);

        // Reset editing field
        setEditingField(null);

        toast({
          title: "Milestone updated",
          description: "Milestone has been successfully updated.",
        });
      } catch (error) {
        console.error(`Error saving ${fieldName}:`, error);
        toast({
          title: "Update failed",
          description: `Failed to update ${fieldName}. Please try again.`,
          variant: "destructive",
        });
      } finally {
        setIsPending(false);
      }
    },
    [milestone, canEdit, formData, setMilestone, toast],
  );

  // Handle key down events for form fields
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    fieldName: string,
  ) => {
    if (e.key === "Enter" && fieldName !== "description") {
      e.preventDefault();
      handleSaveField(fieldName);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditingField(null);

      // Reset the form data for the field
      if (milestone) {
        if (fieldName === "title") {
          setFormData(prev => ({ ...prev, title: milestone.title || "" }));
        } else if (fieldName === "description") {
          setFormData(prev => ({
            ...prev,
            description: milestone.description || "",
          }));
        } else if (fieldName === "dueDate") {
          setFormData(prev => ({
            ...prev,
            dueDate: milestone.due_date
              ? new Date(milestone.due_date).toISOString().split("T")[0]
              : "",
          }));
        }
      }
    }
  };

  // Handle blur events for form fields
  const handleBlur = (fieldName: string) => {
    handleSaveField(fieldName);
  };

  // Create a new milestone
  const handleCreateMilestone = useCallback(async () => {
    if (!project) return;

    setIsCreating(true);

    try {
      // Create a new milestone
      const newMilestone: Partial<MilestoneWithTasks> = {
        id: `milestone-${Date.now()}`,
        project_id: project.id,
        title: "New Milestone",
        description: "",
        status: "draft",
        due_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payment_cents: 0,
        payment_status: "pending",
        tasks_count: 0,
        tasks_completed: 0,
        tasks: [],
        is_current: true,
      };

      // Set as current milestone - this will handle updating milestones array
      // and also set empty tasks array and update contract
      setMilestone(newMilestone);

      setIsDialogOpen(false);

      toast({
        title: "Milestone created",
        description: "New milestone has been created successfully.",
      });
    } catch (error) {
      console.error("Error creating milestone:", error);
      toast({
        title: "Creation failed",
        description: "Failed to create milestone. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }, [project, setMilestone, toast]);

  // Delete a milestone
  const handleDeleteMilestone = useCallback(async () => {
    if (!milestone || !project) return;

    setIsDeleting(true);

    try {
      // Create updated milestones list (without the deleted milestone)
      const updatedMilestones = milestones.filter(m => m.id !== milestone.id);

      // Update the milestones collection first
      setMilestones(updatedMilestones);

      // If there are other milestones, set the first one as current
      if (updatedMilestones.length > 0) {
        // This will handle updating tasks and contract
        setMilestone(updatedMilestones[0]);
      } else {
        // Otherwise, clear current milestone
        setMilestone(null);
        setTasks([]);
        setContract(null);
      }

      setIsDeleteDialogOpen(false);

      toast({
        title: "Milestone deleted",
        description: "Milestone has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting milestone:", error);
      toast({
        title: "Deletion failed",
        description: "Failed to delete milestone. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [
    milestone,
    project,
    milestones,
    setMilestones,
    setMilestone,
    setTasks,
    setContract,
    toast,
  ]);

  return {
    isOpen,
    setIsOpen,
    isDialogOpen,
    setIsDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    editingField,
    setEditingField,
    isPending,
    isCreating,
    isDeleting,
    formData,
    progress,
    daysRemaining,
    canEdit,
    isAdmin,
    milestone: milestone as Partial<MilestoneWithTasks>,
    milestones,
    currentMilestone: milestone,
    formatDate,
    getTimeAgo,
    handleChange,
    handleStatusChange,
    handleMilestoneChange,
    handleSaveField,
    handleKeyDown,
    handleBlur,
    handleCreateMilestone,
    handleDeleteMilestone,
  };
};

export default useMilestoneCard;

/**
 * Hook for getting a contract by milestone - refactored to use app.store for data management
 */
export const useGetContractByMilestone = () => {
  const { setContract, milestone, project, contract } = useAppData();
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
          const contractData = {
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

          // Update contract in app store
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
    data: contract, // Use contract from app store
    isLoading,
    error,
    getContractByMilestone,
  };
};
