import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tables } from "@/types/database.types";
import { Signal, SignalHigh, SignalLow, SignalMedium } from "lucide-react";

interface PrioritySelectProps {
  value: Tables<"tasks">["priority"];
  onValueChange: (value: string) => void;
}

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

const PrioritySelect = ({ value, onValueChange }: PrioritySelectProps) => {
  const priorities = ["low", "medium", "high", "urgent"];

  return (
    <Select value={value} onValueChange={onValueChange}>
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

export default PrioritySelect;
