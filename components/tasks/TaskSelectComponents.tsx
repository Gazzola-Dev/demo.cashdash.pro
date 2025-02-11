import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsAdmin } from "@/hooks/user.hooks";
import { cn } from "@/lib/utils";
import { Tables } from "@/types/database.types";
import {
  CheckCircle2,
  FileEdit,
  GitPullRequest,
  Layers3,
  ListTodo,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Timer,
} from "lucide-react";

type TaskStatus = Tables<"tasks">["status"];
type TaskPriority = Tables<"tasks">["priority"];

interface AssigneeSelectProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  members: {
    user_id: string;
    profile?: {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  }[];
}

export const AssigneeSelect = ({
  value,
  onValueChange,
  members,
}: AssigneeSelectProps) => {
  const isAdmin = useIsAdmin();

  const handleValueChange = (newValue: string) => {
    onValueChange(newValue === "unassigned" ? null : newValue);
  };

  return (
    <Select
      value={value || "unassigned"}
      onValueChange={handleValueChange}
      disabled={!isAdmin}
    >
      <SelectTrigger className="w-48">
        <SelectValue>
          {(() => {
            const selectedProfile = members.find(
              m => m.user_id === value,
            )?.profile;
            if (selectedProfile) {
              return (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={selectedProfile.avatar_url || undefined}
                    />
                    <AvatarFallback>
                      {selectedProfile.display_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{selectedProfile.display_name || "Unnamed User"}</span>
                </div>
              );
            }
            return "Unassigned";
          })()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">
          <div className={cn("flex items-center gap-2")}>
            <Avatar className="h-6 w-6">
              <AvatarFallback>
                <span className="line-through">UA</span>
              </AvatarFallback>
            </Avatar>
            <span>Unassigned</span>
          </div>
        </SelectItem>
        {members.map(member => (
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

interface PrioritySelectProps {
  value: TaskPriority;
  onValueChange: (value: TaskPriority) => void;
}

export const PrioritySelect = ({
  value,
  onValueChange,
}: PrioritySelectProps) => {
  const isAdmin = useIsAdmin();
  const priorities: TaskPriority[] = ["low", "medium", "high", "urgent"];

  return (
    <Select value={value} onValueChange={onValueChange} disabled={!isAdmin}>
      <SelectTrigger className="w-32">
        <SelectValue>
          <div className="flex items-center gap-2">
            <PriorityIcon priority={value} />
            <span className="capitalize">{value}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {priorities.map(priority => (
          <SelectItem key={priority} value={priority}>
            <div className="flex items-center gap-2">
              <PriorityIcon priority={priority} />
              <span className="capitalize">{priority}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const PriorityIcon = ({ priority }: { priority: string }) => {
  switch (priority) {
    case "urgent":
      return <Signal className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
    case "high":
      return (
        <SignalHigh className="h-4 w-4 text-rose-500 dark:text-rose-400" />
      );
    case "medium":
      return (
        <SignalMedium className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
      );
    case "low":
      return <SignalLow className="h-4 w-4 text-sky-500 dark:text-sky-400" />;
    default:
      return null;
  }
};

interface StatusSelectProps {
  value: TaskStatus;
  onValueChange: (value: TaskStatus) => void;
}

export const StatusSelect = ({ value, onValueChange }: StatusSelectProps) => {
  const isAdmin = useIsAdmin();
  const statuses: TaskStatus[] = [
    "backlog",
    "todo",
    "in_progress",
    "in_review",
    "completed",
    "draft",
  ];

  return (
    <Select value={value} onValueChange={onValueChange} disabled={!isAdmin}>
      <SelectTrigger className="w-32">
        <SelectValue>
          <div className="flex items-center gap-2">
            <StatusIcon status={value} />
            <span className="capitalize">{value.replace("_", " ")}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statuses.map(status => (
          <SelectItem key={status} value={status}>
            <div className="flex items-center gap-2">
              <StatusIcon status={status} />
              <span className="capitalize">{status.replace("_", " ")}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "in_review":
      return (
        <GitPullRequest className="h-4 w-4 text-purple-500 dark:text-purple-400" />
      );
    case "in_progress":
      return <Timer className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />;
    case "todo":
      return <ListTodo className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
    case "backlog":
      return <Layers3 className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
    case "completed":
      return (
        <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
      );
    case "draft":
      return <FileEdit className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
    default:
      return null;
  }
};
