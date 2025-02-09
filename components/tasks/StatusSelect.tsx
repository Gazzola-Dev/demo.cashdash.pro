import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tables } from "@/types/database.types";
import {
  CheckCircle2,
  FileEdit,
  GitPullRequest,
  Layers3,
  ListTodo,
  Timer,
} from "lucide-react";

interface StatusSelectProps {
  value: Tables<"tasks">["status"];
  onValueChange: (value: string) => void;
}

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

const StatusSelect = ({ value, onValueChange }: StatusSelectProps) => {
  const statuses = [
    "backlog",
    "todo",
    "in_progress",
    "in_review",
    "completed",
    "draft",
  ];

  return (
    <Select value={value} onValueChange={onValueChange}>
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

export default StatusSelect;
