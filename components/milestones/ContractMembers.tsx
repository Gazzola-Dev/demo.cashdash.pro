import { ContractMember } from "@/components/milestones/ContractDemo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, XCircle } from "lucide-react";
import React from "react";

interface ContractMembersProps {
  members: ContractMember[];
  currentUser: ContractMember;
  isApproved: boolean;
  onApprovalToggle: () => void;
}

export const ContractMembers: React.FC<ContractMembersProps> = ({
  members,
  currentUser,
  isApproved,
  onApprovalToggle,
}) => {
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };

  // Check if a member is the current user
  const isCurrentUser = (member: ContractMember) => {
    return member.id === currentUser.id;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Contract Members</h3>

      <ul className="space-y-3">
        {members.map(member => (
          <li
            key={member.id}
            className={`flex items-center justify-between p-3 rounded-md border ${
              isCurrentUser(member) ? "cursor-pointer hover:bg-accent/50" : ""
            }`}
            onClick={() => isCurrentUser(member) && onApprovalToggle()}
          >
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={member.avatar_url ?? ""} />
                <AvatarFallback>
                  {getInitials(member?.display_name || "")}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="font-medium">{member.display_name}</div>
                <div className="text-xs text-muted-foreground flex items-center space-x-2">
                  <span>{member.role}</span>
                  <Badge
                    variant="outline"
                    className={`capitalize ${
                      isCurrentUser(member)
                        ? isApproved
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                        : member.hasApproved
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {isCurrentUser(member)
                      ? isApproved
                        ? "Approved"
                        : "Pending Approval"
                      : member.hasApproved
                        ? "Approved"
                        : "Pending Approval"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              {isCurrentUser(member) ? (
                <Switch
                  checked={isApproved}
                  onCheckedChange={onApprovalToggle}
                  className="bg-blue-800"
                />
              ) : member.hasApproved ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
          </li>
        ))}
      </ul>

      {members.length === 0 && (
        <div className="text-sm text-muted-foreground italic">
          No members associated with this contract.
        </div>
      )}
    </div>
  );
};
