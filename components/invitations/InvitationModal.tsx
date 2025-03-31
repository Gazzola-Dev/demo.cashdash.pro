import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { capitalizeFirstLetter } from "@/lib/string.util";
import { ProjectInvitationWithDetails } from "@/types/app.types";
import { formatDistanceToNow } from "date-fns";
import { LoaderCircle } from "lucide-react";

interface InvitationModalProps {
  invitation: ProjectInvitationWithDetails;
  onAccept: () => void;
  onDecline: () => void;
  isLoading: boolean;
}

export function InvitationModal({
  invitation,
  onAccept,
  onDecline,
  isLoading,
}: InvitationModalProps) {
  const project = invitation.project;
  const inviter = invitation.sender_profile;

  const invitedTimeAgo = formatDistanceToNow(
    new Date(invitation?.invitation?.created_at ?? ""),
    {
      addSuffix: true,
    },
  );

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span>Project Invitation</span>
        </DialogTitle>
        <DialogDescription>
          You have been invited to join a project?.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4 py-4">
        <div className="flex items-center gap-4">
          {/* Project Icon */}
          <div
            className="w-12 h-12 rounded-md flex items-center justify-center text-xl font-semibold"
            style={{
              backgroundColor: project?.icon_color_bg || "#e5e7eb",
              color: project?.icon_color_fg || "#374151",
            }}
          >
            {project?.icon_name || project?.name?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold">{project?.name}</h3>
            <p className="text-sm text-muted-foreground">
              {project?.description || "No description provided"}
            </p>
          </div>
        </div>

        <div className="border rounded-md p-3 bg-muted/40">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={inviter?.avatar_url || ""}
                alt={inviter?.display_name || "Inviter"}
              />
              <AvatarFallback>
                {capitalizeFirstLetter(inviter?.display_name?.charAt(0) || "U")}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {inviter?.display_name || "A team member"}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {invitedTimeAgo}
            </span>
          </div>
          <p className="text-sm">
            You have been invited to join as a{" "}
            <strong>{invitation.invitation?.role}</strong>.
          </p>
        </div>
      </div>

      <DialogFooter className="flex sm:justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onDecline}
          disabled={isLoading}
        >
          Decline
        </Button>
        <Button
          type="button"
          onClick={onAccept}
          disabled={isLoading}
          className="min-w-24"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            "Accept Invitation"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
