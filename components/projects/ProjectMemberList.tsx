import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, UserPlus } from "lucide-react";

const placeholderMembers = [
  {
    id: "1",
    name: "John Doe",
    role: "owner",
    avatar_url: null,
    professional_title: "Project Lead",
  },
  {
    id: "2",
    name: "Jane Smith",
    role: "admin",
    avatar_url: null,
    professional_title: "Senior Developer",
  },
  {
    id: "3",
    name: "Mike Johnson",
    role: "member",
    avatar_url: null,
    professional_title: "Frontend Engineer",
  },
];

interface ProjectMemberListProps {
  isDraft?: boolean;
}

export function ProjectMemberList({ isDraft = false }: ProjectMemberListProps) {
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
        <Button variant="outline" size="sm" disabled={isDraft}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {placeholderMembers.map(member => (
          <div
            key={member.id}
            className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.avatar_url || undefined} />
              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{member.name}</p>
                <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded-full bg-muted">
                  {member.role}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default ProjectMemberList;
