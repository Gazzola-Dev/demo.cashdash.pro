"use client";

import { acceptInvitationAction } from "@/actions/member.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import configuration from "@/configuration";
import { useGetUserInvites } from "@/hooks/invite.hooks";
import { useGetProfile } from "@/hooks/profile.hooks";
import { useToastQueue } from "@/hooks/useToastQueue";
import { MailPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

interface InvitePageProps {
  params: {
    project_slug: string;
  };
}

export default function InvitePage({ params }: InvitePageProps) {
  const { data: invitesData } = useGetUserInvites();
  const { data: profileData } = useGetProfile();
  const { toast } = useToastQueue();
  const router = useRouter();

  const invitation = invitesData?.invitations.find(
    inv => inv.project.slug === params.project_slug,
  );

  const handleAccept = useCallback(async () => {
    if (!invitation) return;

    try {
      const { error } = await acceptInvitationAction(invitation.id);
      if (error) throw error;

      toast({
        title: "Successfully joined project",
        description: `You are now a member of ${invitation.project.name}`,
      });

      router.push(
        configuration.paths.project.overview({
          project_slug: invitation.project.slug,
        }),
      );
    } catch (error) {
      toast({
        title: "Error accepting invitation",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [invitation, router, toast]);

  const handleDecline = useCallback(() => {
    router.push(configuration.paths.project.all);
  }, [router]);

  if (!invitation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid Invitation</CardTitle>
          <CardDescription>
            This invitation may have expired or been revoked.
          </CardDescription>
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
            <Button variant="outline" onClick={handleDecline}>
              Decline
            </Button>
            <Button onClick={handleAccept}>
              <MailPlus className="h-4 w-4 mr-2" />
              Accept Invitation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
