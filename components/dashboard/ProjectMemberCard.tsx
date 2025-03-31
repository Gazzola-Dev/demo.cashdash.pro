"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useMembersManagement,
  useProjectRole,
  useUpdateProjectMember,
} from "@/hooks/member.hooks";
import { capitalizeFirstLetter } from "@/lib/string.util";
import { ProjectInvitationWithDetails } from "@/types/app.types";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MailPlus,
  Shield,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

// Loading Skeleton Component
const ProjectMembersCardSkeleton = () => {
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

// Component to render the invitation item
const InvitationItem = ({
  invitation,
  onCancel,
}: {
  invitation?: Partial<ProjectInvitationWithDetails> | null;
  onCancel: (id: string) => void;
}) => {
  return (
    <div className="w-full md:w-1/2 p-2 max-w-md opacity-80">
      <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50 dark:bg-gray-800 border-dashed">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-gray-200 dark:bg-gray-700">
            <AvatarFallback>
              {capitalizeFirstLetter(
                (invitation?.invitation?.email || "").substring(0, 2),
              )}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium flex items-center gap-2">
              {invitation?.invitation?.email || "Invited User"}
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
              >
                <Clock className="h-3 w-3 mr-1" />
                <span className="text-xs">Pending</span>
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {invitation?.invitation?.role || "member"}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onCancel(invitation?.invitation?.id ?? "")}
        >
          <X className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};

// Updated ProjectMembersCard component
const ProjectMembersCard = () => {
  // Use our new hook directly to get the updateProjectMember function
  const { updateProjectMember, isPending: isUpdateMemberPending } =
    useUpdateProjectMember();

  const {
    isOpen,
    setIsOpen,
    isInviteDialogOpen,
    setIsInviteDialogOpen,
    isConfirmDialogOpen,
    setIsConfirmDialogOpen,
    confirmAction,
    emailsInput,
    setEmailsInput,
    isAdmin,
    user,
    projectInvitations,
    isTogglePending,
    isRemovePending,
    isLoading,
    members,
    handleTogglePMRole,
    handleInviteMembers,
    confirmRemoveMember,
    confirmCancelInvitation,
    handleConfirmAction,
    handleCancelConfirmAction,
    isUserPM,
    isInvitePending,
    isCancelPending,
  } = useMembersManagement();

  // Use the projectRole hook to determine if the current user is a project manager
  const { isProjectManager } = useProjectRole();

  if (isLoading) {
    return <ProjectMembersCardSkeleton />;
  }

  const pendingInvitations = projectInvitations?.filter(
    inv => inv.invitation?.status === "pending",
  );

  // Function to handle role toggle directly with updateProjectMember
  const handleRoleToggle = (
    memberId: string,
    userId: string,
    currentRole: string,
  ) => {
    // Don't allow changing your own role
    if (userId === user?.id) return;

    // Toggle between 'pm' and 'member' roles
    const newRole = isUserPM(currentRole) ? "member" : "pm";

    // Call updateProjectMember directly
    updateProjectMember(memberId, newRole);
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Members</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && isOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInviteDialogOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Invite
                </Button>
              )}
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
                {members.length} team members
                {!!pendingInvitations?.length
                  ? `, ${pendingInvitations.length} pending invitations`
                  : ""}
              </div>
            )}

            {/* Expanded view - show members with scroll */}
            <CollapsibleContent className="space-y-2">
              <div className="overflow-x-auto" style={{ maxHeight: "320px" }}>
                <div className="flex flex-row flex-wrap">
                  {/* Render active members */}
                  {members.map(
                    member =>
                      member && (
                        <div
                          key={member.user_id}
                          className="w-full md:w-1/2 p-2 max-w-md"
                        >
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={member.profile?.avatar_url || undefined}
                                />
                                <AvatarFallback>
                                  {capitalizeFirstLetter(
                                    (
                                      member.profile?.display_name || ""
                                    ).substring(0, 2),
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {member.profile?.display_name ||
                                    "Unnamed User"}
                                  {isUserPM(member.role ?? "") && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Badge
                                            variant="outline"
                                            className="h-5 flex items-center gap-1"
                                          >
                                            <Shield className="h-3 w-3" />
                                            <span className="text-xs">PM</span>
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Project Manager with administrative
                                          privileges
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground capitalize">
                                  {member.role}
                                </div>
                              </div>
                            </div>

                            {/* Show PM controls if user is admin or a project manager */}
                            {(isAdmin || isProjectManager) && (
                              <div className="flex items-center gap-2">
                                {/* Only show PM toggle if not the current user */}
                                {user?.id !== member.user_id && (
                                  <>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="text-xs text-muted-foreground mr-1">
                                            PM
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Toggle Project Manager role
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <Switch
                                      className="bg-blue-800"
                                      checked={isUserPM(member.role ?? "")}
                                      onCheckedChange={() =>
                                        handleRoleToggle(
                                          member.id ?? "",
                                          member.user_id ?? "",
                                          member.role ?? "",
                                        )
                                      }
                                      disabled={
                                        isUpdateMemberPending || isTogglePending
                                      }
                                    />
                                  </>
                                )}

                                {user?.id !== member.user_id && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 ml-1"
                                          onClick={() =>
                                            confirmRemoveMember(
                                              member.id ?? "",
                                              member.profile?.display_name ||
                                                "this member",
                                            )
                                          }
                                          disabled={isRemovePending}
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Remove member from project
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ),
                  )}

                  {/* Render pending invitations */}
                  {!!pendingInvitations?.length && (
                    <>
                      {pendingInvitations.map(invitation => (
                        <InvitationItem
                          key={invitation.invitation?.id}
                          invitation={invitation}
                          onCancel={id =>
                            confirmCancelInvitation(
                              id,
                              invitation.invitation?.email || "this invitation",
                            )
                          }
                        />
                      ))}
                    </>
                  )}

                  {/* Add a placeholder if no members or invitations */}
                  {members.length === 0 && !pendingInvitations?.length && (
                    <div className="w-full p-4 text-center text-muted-foreground">
                      No team members yet
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

      {/* Invite Members Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Members</DialogTitle>
            <DialogDescription>
              Enter email addresses to invite new members to your project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Enter email addresses (comma or space separated)
e.g. user@example.com, another@example.com"
              rows={4}
              value={emailsInput}
              onChange={e => setEmailsInput(e.target.value)}
              className="resize-none"
            />
            <div className="flex items-center text-sm">
              <MailPlus className="h-4 w-4 mr-2 text-blue-500" />
              <p className="text-muted-foreground">
                Members will receive an email invitation to join this project.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInviteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMembers}
              disabled={isInvitePending || !emailsInput.trim()}
            >
              {isInvitePending ? "Sending..." : "Send Invites"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Remove Member/Cancel Invitation */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "member"
                ? "Remove Member"
                : "Cancel Invitation"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "member"
                ? `Are you sure you want to remove ${confirmAction?.name || "this member"} from the project?`
                : `Are you sure you want to cancel the invitation for ${confirmAction?.name || "this email"}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={handleCancelConfirmAction}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmAction}
              disabled={isRemovePending || isCancelPending}
            >
              {confirmAction?.type === "member"
                ? isRemovePending
                  ? "Removing..."
                  : "Remove"
                : isCancelPending
                  ? "Canceling..."
                  : "Cancel Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectMembersCard;
