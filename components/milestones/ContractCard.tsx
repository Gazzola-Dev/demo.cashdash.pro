import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetContractByMilestone } from "@/hooks/contract.hooks";
import { formatCurrency } from "@/lib/contract.util";
import { useAppData } from "@/stores/app.store";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { ContractDetails } from "./ContractDetails";
import { ContractMembers } from "./ContractMembers";
import { ContractPayment } from "./ContractPayment";
import { ContractTasks } from "./ContractTasks";

export const ContractCard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [allPMsApproved, setAllPMsApproved] = useState(false);

  // Get data from the app store
  const { milestone, contract, tasks } = useAppData();

  const contractMembers = contract?.members || [];

  // Initialize the fetch but don't use the returned data directly
  const { isLoading, error } = useGetContractByMilestone(milestone?.id);

  const handleApprovalToggle = () => {
    setIsApprovalDialogOpen(true);
  };

  const handleConfirmApproval = () => {
    setIsApproved(!isApproved);
    setIsApprovalDialogOpen(false);

    // Update the members array with the new approval status
    const updatedMembers = contractMembers.map(member =>
      member.id === contractMembers[0]?.id
        ? { ...member, hasApproved: !isApproved }
        : member,
    );

    // Check if all project managers have approved
    const projectManagers = updatedMembers.filter(
      member =>
        member.role === "project_manager" ||
        member.role === "admin" ||
        member.role === "owner",
    );
    const allApproved = projectManagers.every(pm => pm.hasApproved);
    setAllPMsApproved(allApproved);
  };

  // Show loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Contract</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
          <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Contract</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-red-500">Error loading contract data</p>
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no contract is found
  if (!contract) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Contract</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            No contract associated with this milestone
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Contract</CardTitle>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                {isOpen ? (
                  <>
                    Collapse <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Details <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Always show contract price and title summary when collapsed */}
            {!isOpen && (
              <div className="flex flex-col sm:flex-row sm:justify-between space-y-2 sm:space-y-0">
                {contract.title && (
                  <div className="font-medium">{contract.title}</div>
                )}
                <div className="flex items-center text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    ${formatCurrency(contract.total_amount_cents / 100)}
                  </span>
                </div>
              </div>
            )}

            {/* Expanded content */}
            <CollapsibleContent className="space-y-6 pt-4">
              <ContractDetails
                price={contract.total_amount_cents / 100}
                startDate={new Date(contract.start_date)}
                title={contract.title}
              />

              <ContractTasks tasks={tasks} />

              <ContractMembers />

              {/* Contract Payment - only visible when expanded */}
              <ContractPayment
                contract={{
                  id: contract.id,
                  title: contract.title,
                  price: contract.total_amount_cents / 100,
                  project_id: contract.project_id,
                  startDate: new Date(contract.start_date),
                  tasks: tasks,
                  members: contractMembers,
                }}
                currentUser={contractMembers[0] || {}}
                allMembers={contractMembers}
                expanded={isOpen}
                allPMsApproved={allPMsApproved}
              />
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

      <Dialog
        open={isApprovalDialogOpen}
        onOpenChange={setIsApprovalDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isApproved ? "Revoke Approval" : "Approve Contract"}
            </DialogTitle>
            <DialogDescription>
              {isApproved
                ? "Are you sure you want to revoke your approval for this contract?"
                : "By approving this contract, you confirm that all terms are acceptable."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApprovalDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmApproval}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContractCard;
