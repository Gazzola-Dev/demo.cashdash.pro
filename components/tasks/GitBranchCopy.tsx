// components/shared/GitBranchCopy.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { GitBranch } from "lucide-react";
import { useCallback } from "react";
import slugify from "slugify";

export const GitBranchCopy = ({
  projectPrefix = "",
  taskOrdinalId = "",
  taskTitle = "",
}: {
  projectPrefix?: string | null;
  taskOrdinalId?: number | string | null;
  taskTitle?: string | null;
}) => {
  const { toast } = useToast();

  const copyBranchName = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
      }
      const branchName = `${projectPrefix}${taskOrdinalId}-${slugify(
        taskTitle ?? "",
      )
        .toLowerCase()
        .slice(0, 50)}`;

      navigator.clipboard
        .writeText(branchName)
        .then(() => {
          toast({
            title: "Branch name copied to clipboard",
            description: branchName,
          });
        })
        .catch(error => {
          console.error("Failed to copy to clipboard:", error);
          toast({
            title: "Failed to copy to clipboard",
            variant: "destructive",
          });
        });
    },
    [projectPrefix, taskOrdinalId, taskTitle, toast],
  );

  return (
    <Button variant="outline" size="icon" onClick={copyBranchName} className="">
      <GitBranch className="" />
    </Button>
  );
};

export default GitBranchCopy;
