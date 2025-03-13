import React, { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tables } from "@/types/database.types";

interface ContractTasksProps {
  tasks: Partial<Tables<"tasks">>[];
}

export const ContractTasks: React.FC<ContractTasksProps> = ({ tasks }) => {
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>(
    {},
  );

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Function to truncate task name if it's too long
  const truncateName = (name: string, maxLength = 40) => {
    if (name.length <= maxLength) return name;
    return `${name.substring(0, maxLength)}...`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Contract Tasks</h3>

      <Accordion type="multiple" className="space-y-2">
        {tasks.map(task => (
          <AccordionItem
            key={task.id}
            value={task.id ?? ""}
            className="border rounded-md px-4 py-2"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center text-sm">
                <span className="font-mono mr-2">{task.ordinal_id}</span>
                <span>{truncateName(task.title ?? "")}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-sm mt-2 ml-6 text-muted-foreground whitespace-pre-wrap">
                {task.description}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {tasks.length === 0 && (
        <div className="text-sm text-muted-foreground italic">
          No tasks associated with this contract.
        </div>
      )}
    </div>
  );
};
