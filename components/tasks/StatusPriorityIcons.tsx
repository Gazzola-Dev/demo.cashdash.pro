// components/shared/StatusPriorityIcons.tsx
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

export const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "in_review":
      return (
        <GitPullRequest className="h-4 w-4 text-purple-500 dark:text-purple-400" />
      );
    case "in_progress":
      return <Timer className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
    case "todo":
      return (
        <ListTodo className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
      );
    case "backlog":
      return <Layers3 className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
    case "completed":
      return (
        <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
      );
    case "draft":
      return <FileEdit className="h-4 w-4 text-gray-400 dark:text-gray-500" />;
    default:
      return null;
  }
};

export const priorityOrder = ["urgent", "high", "medium", "low"];
export const statusOrder = [
  "in_review",
  "in_progress",
  "todo",
  "backlog",
  "completed",
  "draft",
];
