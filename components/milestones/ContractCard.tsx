// components/milestones/ContractCard.tsx
import { Contract, ContractMember } from "@/components/milestones/ContractDemo";
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
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useEffect, useState } from "react";
import { ContractDetails } from "./ContractDetails";
import { ContractMembers } from "./ContractMembers";
import { ContractPayment } from "./ContractPayment";
import { ContractTasks } from "./ContractTasks";

interface ContractCardProps {
  contract: Contract;
  currentUser: ContractMember;
}

export const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  currentUser,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [members, setMembers] = useState<ContractMember[]>(contract.members);

  // Calculate if all PMs have approved
  const [allPMsApproved, setAllPMsApproved] = useState(false);

  // Check if all project managers have approved whenever members or isApproved changes
  useEffect(() => {
    const projectManagers = members.filter(
      member => member.role === "project manager" || member.role === "admin",
    );

    // Create a new array with the current user's approval status updated
    const updatedMembers = members.map(member =>
      member.id === currentUser.id
        ? { ...member, hasApproved: isApproved }
        : member,
    );

    // Check if all PMs have approved
    const allApproved = updatedMembers
      .filter(
        member => member.role === "project manager" || member.role === "admin",
      )
      .every(pm => pm.hasApproved);

    // Update the members state with the current user's updated approval status
    setMembers(updatedMembers);

    // Update the allPMsApproved state
    setAllPMsApproved(allApproved);
  }, [isApproved, currentUser.id]);

  const handleApprovalToggle = () => {
    setIsApprovalDialogOpen(true);
  };

  const handleConfirmApproval = () => {
    setIsApproved(!isApproved);
    setIsApprovalDialogOpen(false);

    // Update the members array with the new approval status
    const updatedMembers = members.map(member =>
      member.id === currentUser.id
        ? { ...member, hasApproved: !isApproved }
        : member,
    );
    setMembers(updatedMembers);

    // Check if all project managers have approved
    const projectManagers = updatedMembers.filter(
      member => member.role === "project manager" || member.role === "admin",
    );
    const allApproved = projectManagers.every(pm => pm.hasApproved);
    setAllPMsApproved(allApproved);
  };

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
                    ${contract.price}
                  </span>
                </div>
              </div>
            )}

            {/* Expanded content */}
            <CollapsibleContent className="space-y-6 pt-4">
              <ContractDetails
                price={contract.price}
                startDate={contract.startDate}
                title={contract.title}
              />

              <ContractTasks tasks={contract.tasks} />

              <ContractMembers
                members={members}
                currentUser={currentUser}
                isApproved={isApproved}
                onApprovalToggle={handleApprovalToggle}
              />

              {/* Contract Payment - only visible when expanded */}
              <ContractPayment
                contract={contract}
                currentUser={currentUser}
                allMembers={members}
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
