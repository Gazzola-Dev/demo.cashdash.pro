"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import {
  useContractMembers,
  useToggleContractMember,
  useUpdateContractMemberApproval,
} from "@/hooks/contract.hooks";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export const ContractMembersCardSkeleton = () => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </CardContent>
    </Card>
  );
};

export const ContractMembers = () => {
  const [isOpen, setIsOpen] = useState(true);
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
  } = useContractMembers();

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

  // Count contract members
  const contractMembersCount = projectMembers.filter(member =>
    isContractMember(member.user_id),
  ).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Contract Members</CardTitle>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {/* Collapsed view - just show a count */}
          {!isOpen && (
            <div className="text-sm text-muted-foreground">
              {contractMembersCount} contract members
            </div>
          )}

          {/* Expanded view - show members with scroll */}
          <CollapsibleContent className="space-y-4">
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
                      className="flex items-center justify-between p-3 rounded-md border px-6"
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
                            <span>
                              {member.role === "pm"
                                ? "Project Manager"
                                : member.role[0].toUpperCase() +
                                  member.role.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isIncluded && (
                        <div className="flex items-center gap-3">
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
                          <Switch
                            className="bg-blue-800"
                            checked={hasApproved}
                            onCheckedChange={checked =>
                              handleToggleApproval(memberId, checked)
                            }
                            disabled={isApprovalPending || !isCurrent}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {!isProjectManager && projectMembers.length > 0 && (
              <div className="text-xs text-muted-foreground mt-2">
                Note: While you can see the contract members, only project
                managers can add or remove members. However, you can still
                toggle your own approval status.
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
};

export default ContractMembers;
