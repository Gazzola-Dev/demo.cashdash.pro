import { cn } from "@/lib/utils";
import { useAppData } from "@/stores/app.store";
import * as LucideIcons from "lucide-react";
import { type LucideProps } from "lucide-react";

const ProjectIcon = ({ ...props }: LucideProps & { className?: string }) => {
  const { project } = useAppData();
  let iconName = project?.icon_name;
  let cleanIconName = iconName?.replace("lucide:", "") || "code-2";
  let iconColorFg = project?.icon_color_fg;
  let iconColorBg = project?.icon_color_bg;
  if (!project) {
    iconName = "log-in";
    cleanIconName = iconName?.replace("lucide:", "") || "code-2";
    iconColorBg = "#dddddd";
    iconColorFg = "black";
  }
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
