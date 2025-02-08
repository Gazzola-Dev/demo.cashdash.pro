import ActionButton from "@/components/shared/ActionButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { useGetProject, useInviteMember } from "@/hooks/project.hooks";
import { useGetUser, useIsAdmin } from "@/hooks/user.hooks";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ChevronUp, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export function ProjectMemberList({ isDraft = false }: { isDraft?: boolean }) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const isAdmin = useIsAdmin();
  const { mutate: inviteMember, isPending } = useInviteMember();
  const { data: project } = useGetProject();
  const { data: user } = useGetUser();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = (data: InviteFormValues) => {
    if (user?.id && project?.id)
      inviteMember(
        {
          email: data.email,
          project_id: project.id,
          role: "member",
          status: "pending",
          invited_by: user.id,
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          onSuccess: () => {
            setIsInviteOpen(false);
            form.reset();
          },
        },
      );
  };

  return (
    <Card className="relative">
      {isDraft && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="bg-background border rounded-lg p-4 max-w-md text-center space-y-2 mx-4">
            <AlertCircle className="w-6 h-6 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Publish your project to start inviting team members
            </p>
          </div>
        </div>
      )}

      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage your project team</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isAdmin && (
          <Collapsible open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" disabled={isDraft}>
                {isInviteOpen ? (
                  <ChevronUp className="w-4 h-4 mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {isInviteOpen ? "Cancel" : "Invite"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="flex items-center gap-2"
              >
                <Input
                  placeholder="Email address"
                  {...form.register("email")}
                  className={cn(
                    "flex-1",
                    form.formState.errors.email && "border-destructive",
                  )}
                />
                <ActionButton
                  type="submit"
                  size="sm"
                  loading={isPending}
                  disabled={!form.formState.isValid}
                >
                  Send Invite
                </ActionButton>
              </form>
              {form.formState.errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
        {/* Pending Invitations */}
        {project?.project_invitations?.map(invite => (
          <div
            key={invite.id}
            className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 border border-dashed border-muted-foreground/20"
          >
            <Avatar className="h-10 w-10 opacity-50">
              <AvatarImage src={undefined} />
              <AvatarFallback>
                {invite.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate text-muted-foreground">
                  {invite.email}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded-full bg-muted/50">
                    {invite.role}
                  </span>
                  <span className="text-xs text-amber-500 dark:text-amber-400 bg-amber-500/10 capitalize px-2 py-0.5 rounded-full">
                    Pending
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-xs text-muted-foreground">
                  Invited by {invite.inviter?.display_name || "Unknown"}
                </p>
                <span className="text-xs text-muted-foreground">•</span>
                <p className="text-xs text-muted-foreground">
                  Expires {new Date(invite.expires_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Active Members */}
        {project?.project_members?.map(member => (
          <div
            key={member.id}
            className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.profile?.avatar_url || undefined} />
              <AvatarFallback>
                {member.profile?.display_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">
                  {member.profile?.display_name}
                </p>
                <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded-full bg-muted">
                  {member.role}
                </span>
              </div>
              {member.profile?.professional_title && (
                <p className="text-sm text-muted-foreground truncate">
                  {member.profile.professional_title}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default ProjectMemberList;
