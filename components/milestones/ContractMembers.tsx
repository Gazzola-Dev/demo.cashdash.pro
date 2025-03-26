"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  useContractMembers,
  useToggleContractMember,
  useUpdateContractMemberApproval,
} from "@/hooks/contract.hooks";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

export const ContractMembers = () => {
  const { toggleContractMember, isPending: isTogglePending } =
    useToggleContractMember();
  const { updateContractMemberApproval, isPending: isApprovalPending } =
    useUpdateContractMemberApproval();

  const {
    contract,
    projectMembers,
    getInitials,
    isCurrentUser,
    isContractMember,
    getMemberApprovalStatus,
    handleToggleMember,
    handleToggleApproval,
    isProjectManager,
  } = useContractMembers(
    toggleContractMember,
    isTogglePending,
    updateContractMemberApproval,
    isApprovalPending,
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
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Contract Members</h3>
        {!isProjectManager && (
          <div className="flex items-center text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>Only Project Managers can modify members</span>
          </div>
        )}
      </div>

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
                    disabled={isTogglePending || !isProjectManager}
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

      {!isProjectManager && projectMembers.length && (
        <div className="text-xs text-muted-foreground mt-2">
          Note: While you can see the contract members, only project managers
          can add or remove members. However, you can still toggle your own
          approval status.
        </div>
      )}
    </div>
  );
};

export default ContractMembers;
