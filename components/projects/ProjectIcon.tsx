import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { type LucideProps } from "lucide-react";
import React from "react";

interface ProjectIconProps extends LucideProps {
  iconName?: string | null;
  iconColorFg?: string | null;
  iconColorBg?: string | null;
}

const ProjectIcon: React.FC<ProjectIconProps> = ({
  iconName = null,
  iconColorFg = null,
  iconColorBg = null,
  ...props
}) => {
  const cleanIconName = iconName?.replace("lucide:", "") || "code-2";
  const pascalCaseName = cleanIconName
    .split("-")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");

  const BaseIcon =
    (LucideIcons[
      pascalCaseName as keyof typeof LucideIcons
    ] as LucideIcons.LucideIcon) || LucideIcons.Code2;

  return (
    <div
      className="p-1.5 rounded-lg"
      style={{
        backgroundColor: iconColorBg || "",
      }}
    >
      <BaseIcon
        {...props}
        style={{
          color: iconColorFg || "",
        }}
        className={cn("h-4 w-4 shrink-0", props.className)}
      />
    </div>
  );
};

ProjectIcon.displayName = "ProjectIcon";

export default ProjectIcon;
