import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetUser } from "@/hooks/user.hooks";
import { cn } from "@/lib/utils";
import { Tables } from "@/types/database.types";

type Profile = Tables<"profiles">;
type ProjectMember = {
  user_id: string;
  profile?: Profile | null;
};

interface AssigneeSelectProps {
  value: string | null;
  onValueChange: (value: string) => void;
  members: ProjectMember[];
}

export const AssigneeSelect = ({
  value,
  onValueChange,
  members,
}: AssigneeSelectProps) => {
  const { data: currentUser } = useGetUser();

  // Sort members alphabetically by display name, but keep current user at top
  const sortedMembers = [...members].sort((a, b) => {
    // Current user always comes first
    if (a.user_id === currentUser?.id) return -1;
    if (b.user_id === currentUser?.id) return 1;

    // Sort others alphabetically
    const nameA = a.profile?.display_name?.toLowerCase() || "";
    const nameB = b.profile?.display_name?.toLowerCase() || "";
    return nameA.localeCompare(nameB);
  });

  const selectedProfile = members.find(m => m.user_id === value)?.profile;

  return (
    <Select value={value || "unassigned"} onValueChange={onValueChange}>
      <SelectTrigger className="w-48">
        <SelectValue>
          {selectedProfile ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedProfile.avatar_url || undefined} />
                <AvatarFallback>
                  {selectedProfile.display_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span>{selectedProfile.display_name || "Unnamed User"}</span>
            </div>
          ) : (
            "Unassigned"
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">
          <div className={cn("flex items-center gap-2")}>
            <Avatar className="h-6 w-6">
              <AvatarFallback>{"UA"}</AvatarFallback>
            </Avatar>
            <span>Unassigned</span>
          </div>
        </SelectItem>
        {sortedMembers.map(member => (
          <SelectItem key={member.user_id} value={member.user_id}>
            <div className={cn("flex items-center gap-2")}>
              <Avatar className="h-6 w-6">
                <AvatarImage src={member.profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {member.profile?.display_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span>{member.profile?.display_name || "Unnamed User"}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default AssigneeSelect;
