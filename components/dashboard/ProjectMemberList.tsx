import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { capitalizeFirstLetter } from "@/lib/string.util";
import { useAppData } from "@/stores/app.store";
import { ChevronDown, ChevronUp, UserPlus } from "lucide-react";
import { useState } from "react";

const ProjectMemberListCard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { project, isAdmin } = useAppData();

  const members = project?.project_members || [];

  const togglePMRole = (memberId: string) => {
    // This will be implemented later with the actual functionality
    console.log("Toggling PM role for member", memberId);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Members</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && isOpen && (
              <Button variant="outline" size="sm">
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
            </div>
          )}

          {/* Expanded view - show members with scroll */}
          <CollapsibleContent className="space-y-2">
            <div className="overflow-x-auto" style={{ maxHeight: "320px" }}>
              <div className="flex flex-row flex-wrap">
                {members.map(member => (
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
                              (member.profile?.display_name || "").substring(
                                0,
                                2,
                              ),
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {member.profile?.display_name || "Unnamed User"}
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {member.role}
                          </div>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground mr-1">
                            PM
                          </span>
                          <Switch
                            checked={
                              member.role === "owner" || member.role === "admin"
                            }
                            onCheckedChange={() => togglePMRole(member.user_id)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add a placeholder if no members */}
                {members.length === 0 && (
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
  );
};

export default ProjectMemberListCard;
