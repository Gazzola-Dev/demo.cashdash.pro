import { icons } from "@/lib/iconList.util";
import { cn } from "@/lib/utils";
import { useAppData } from "@/stores/app.store";
import { Tables } from "@/types/database.types";
import * as LucideIcons from "lucide-react";
import { type LucideProps } from "lucide-react";

const ProjectIcon = ({
  ...props
}: LucideProps & { className?: string; project?: Tables<"projects"> }) => {
  const { project: appProject } = useAppData();
  const propProject = props.project;
  let iconName = propProject ? propProject?.icon_name : appProject?.icon_name;
  let iconColorFg = propProject
    ? propProject?.icon_color_fg
    : appProject?.icon_color_fg;
  let iconColorBg = propProject
    ? propProject?.icon_color_bg
    : appProject?.icon_color_bg;

  let cleanIconName = iconName?.replace("lucide:", "") || "code-2";
  if (!propProject && !appProject) {
    iconName = "log-in";
    cleanIconName = iconName?.replace("lucide:", "") || "code-2";
    iconColorBg = "#dddddd";
    iconColorFg = "black";
  }
  const pascalCaseName = cleanIconName
    .split("-")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");

  const ProjectIcon =
    icons.find(icon => icon.name === iconName)?.component || LucideIcons.Code2;

  return (
    <div
      className="p-1.5 rounded-lg"
      style={{
        backgroundColor: iconColorBg || "",
      }}
    >
      <ProjectIcon
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
