"use client";

import ActionButton from "@/components/shared/ActionButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import configuration from "@/configuration";
import {
  useGetUserInvites,
  useRespondToInvitation,
} from "@/hooks/invite.hooks";
import { useToastQueue } from "@/hooks/useToastQueue";
import { MailPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface InvitePageProps {
  params: {
    project_slug: string;
  };
}

enum InviteAction {
  Accept = "accept",
  Decline = "decline",
}

export default function InvitePage({ params }: InvitePageProps) {
  const [isAccepted, setIsAccepted] = useState(false);
  const { data: invitesData, isPending: getInvitesIsPending } =
    useGetUserInvites();
  const { mutate: respondToInvitation, isPending } = useRespondToInvitation();
  const { toast } = useToastQueue();
  const router = useRouter();

  const onClick = (action: InviteAction) => {
    const invitation = invitesData?.invitations.find(
      inv => inv.project.slug === params.project_slug,
    );

    if (!invitation) {
      toast({
        title: "Error",
        description: "Invitation not found",
        variant: "destructive",
      });
      return;
    }

    respondToInvitation(
      {
        invitationId: invitation.id,
        accept: action === InviteAction.Accept,
      },
      {
        onSuccess: () => {
          if (action === InviteAction.Accept) setIsAccepted(true);
          toast({
            title:
              action === InviteAction.Accept
                ? "Invitation accepted"
                : "Invitation declined",
            description:
              action === InviteAction.Accept
                ? "You have been added to the project"
                : "Invitation has been declined",
          });

          if (action === InviteAction.Accept) {
            router.push(
              configuration.paths.project.overview({
                project_slug: params.project_slug,
              }),
            );
          } else {
            router.push(configuration.paths.project.all);
          }
        },
        onError: error => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      },
    );
  };

  const invitation = invitesData?.invitations.find(
    inv => inv.project.slug === params.project_slug,
  );

  if (!invitation) {
    return (
      <Card>
        <CardHeader>
          {isAccepted ? (
            <>
              <CardTitle>Invitation Accepted</CardTitle>
              <CardDescription>
                Please wait, you will be redirected to the project overview.
              </CardDescription>
            </>
          ) : getInvitesIsPending ? (
            <>
              <CardTitle>Loading...</CardTitle>
              <CardDescription>
                Please wait while we check for your invitations.
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle>Invalid Invitation</CardTitle>
              <CardDescription>
                This invitation may have expired or been revoked.
              </CardDescription>
            </>
          )}
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="container max-w-2xl mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Project Invitation</CardTitle>
          <CardDescription>
            You have been invited to join {invitation.project.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Invited by</p>
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={invitation.inviter.avatar_url || undefined}
                  />
                  <AvatarFallback>
                    {invitation.inviter.display_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {invitation.inviter.display_name}
                  </p>
                  {invitation.inviter.professional_title && (
                    <p className="text-sm text-muted-foreground truncate">
                      {invitation.inviter.professional_title}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Project</p>
            <p className="mt-1 text-sm">{invitation.project.name}</p>
          </div>

          <div>
            <p className="text-sm font-medium">Role</p>
            <p className="mt-1 text-sm capitalize">{invitation.role}</p>
          </div>

          <div className="pt-4 flex justify-end gap-4">
            <ActionButton
              variant="outline"
              onClick={() => onClick(InviteAction.Decline)}
              loading={isPending}
            >
              Decline
            </ActionButton>
            <ActionButton
              onClick={() => onClick(InviteAction.Accept)}
              loading={isPending}
            >
              <MailPlus className="h-4 w-4 mr-2" />
              Accept Invitation
            </ActionButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
