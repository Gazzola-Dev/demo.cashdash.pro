import { useIsAdmin } from "@/hooks/user.hooks";
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

interface AssigneeSelectSimpleProps {
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

export const AssigneeSelectSimple = ({
  value,
  onValueChange,
  members,
}: AssigneeSelectSimpleProps) => {
  const isAdmin = useIsAdmin();

  const handleValueChange = (newValue: string) => {
    onValueChange(newValue === "unassigned" ? null : newValue);
  };

  return (
    <select
      value={value || "unassigned"}
      onChange={e => handleValueChange(e.target.value)}
      disabled={!isAdmin}
      className="w-48 p-2 border rounded-md disabled:opacity-50 bg-white dark:bg-gray-800"
    >
      <option value="unassigned">Unassigned</option>
      {members.map(member => (
        <option key={member.user_id} value={member.user_id}>
          {member.profile?.display_name || "Unnamed User"}
        </option>
      ))}
    </select>
  );
};

interface PrioritySelectSimpleProps {
  value: TaskPriority;
  onValueChange: (value: TaskPriority) => void;
}

export const PrioritySelectSimple = ({
  value,
  onValueChange,
}: PrioritySelectSimpleProps) => {
  const isAdmin = useIsAdmin();
  const priorities: TaskPriority[] = ["low", "medium", "high", "urgent"];

  return (
    <select
      value={value}
      onChange={e => onValueChange(e.target.value as TaskPriority)}
      disabled={!isAdmin}
      className="w-32 p-2 border rounded-md disabled:opacity-50 bg-white dark:bg-gray-800"
    >
      {priorities.map(priority => (
        <option key={priority} value={priority}>
          <div className="flex items-center gap-2">
            <PriorityIconSimple priority={priority} />
            <span className="capitalize">{priority}</span>
          </div>
        </option>
      ))}
    </select>
  );
};

export const PriorityIconSimple = ({ priority }: { priority: string }) => {
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

interface StatusSelectSimpleProps {
  value: TaskStatus;
  onValueChange: (value: TaskStatus) => void;
}

export const StatusSelectSimple = ({
  value,
  onValueChange,
}: StatusSelectSimpleProps) => {
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
    <select
      value={value}
      onChange={e => onValueChange(e.target.value as TaskStatus)}
      className="w-32 p-2 border rounded-md disabled:opacity-50 bg-white dark:bg-gray-800"
      disabled={!isAdmin}
    >
      {statuses.map(status => (
        <option key={status} value={status}>
          <div className="flex items-center gap-2">
            <StatusIconSimple status={status} />
            <span className="capitalize">{status.replace("_", " ")}</span>
          </div>
        </option>
      ))}
    </select>
  );
};

export const StatusIconSimple = ({ status }: { status: string }) => {
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

export default {
  AssigneeSelectSimple,
  PrioritySelectSimple,
  StatusSelectSimple,
  PriorityIconSimple,
  StatusIconSimple,
};
