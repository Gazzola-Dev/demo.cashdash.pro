"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  useToggleContractMember,
  useUpdateContractMemberApproval,
} from "@/hooks/contract.hooks";
import { useAppData } from "@/stores/app.store";
import { CheckCircle, XCircle } from "lucide-react";
import { useCallback } from "react";

export const ContractMembers = () => {
  // Get data from the app store
  const { contract, user, project } = useAppData();
  const { toggleContractMember, isPending: isTogglePending } =
    useToggleContractMember();
  const { updateContractMemberApproval, isPending: isApprovalPending } =
    useUpdateContractMemberApproval();

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
      if (!contract?.id) return;
      toggleContractMember(contract.id, memberId, checked);
    },
    [contract?.id, toggleContractMember],
  );

  // Handle toggling approval status for current user
  const handleToggleApproval = useCallback(
    (memberId: string, approved: boolean) => {
      if (!contract?.id) return;
      updateContractMemberApproval(contract.id, memberId, approved);
    },
    [contract?.id, updateContractMemberApproval],
  );

  if (!contract) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Contract Members</h3>
        <div className="text-sm text-muted-foreground italic">
          No contract associated with this milestone.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Contract Members</h3>

      {projectMembers.length === 0 ? (
        <div className="text-sm text-muted-foreground italic">
          No members in this project yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {projectMembers.map(member => {
            const memberId = member.user_id;
            const memberProfile = member.profile;
            const isIncluded = isContractMember(memberId);
            const hasApproved = getMemberApprovalStatus(memberId);
            const isCurrent = isCurrentUser(memberId);

            return (
              <li
                key={memberId}
                className="flex items-center justify-between p-3 rounded-md border"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isIncluded}
                    onCheckedChange={checked =>
                      handleToggleMember(memberId, !!checked)
                    }
                    disabled={isTogglePending}
                  />
                  <Avatar>
                    <AvatarImage src={memberProfile?.avatar_url ?? ""} />
                    <AvatarFallback>
                      {getInitials(memberProfile?.display_name || "")}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <div className="font-medium">
                      {memberProfile?.display_name || "Unnamed User"}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center space-x-2">
                      <span>{member.role}</span>
                      {isIncluded && (
                        <Badge
                          variant="outline"
                          className={`capitalize ${
                            hasApproved
                              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                          }`}
                        >
                          {hasApproved ? "Approved" : "Pending Approval"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {isIncluded && (
                  <div className="flex items-center">
                    {isCurrent ? (
                      <Switch
                        checked={hasApproved}
                        onCheckedChange={checked =>
                          handleToggleApproval(memberId, checked)
                        }
                        disabled={isApprovalPending}
                      />
                    ) : hasApproved ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ContractMembers;
