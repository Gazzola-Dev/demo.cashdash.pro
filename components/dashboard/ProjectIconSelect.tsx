import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUpdateProject } from "@/hooks/app.hooks";
import useAppData from "@/hooks/useAppData";
import { icons } from "@/lib/iconList.util";
import { cn } from "@/lib/utils";
import { ChevronDown, Code2 } from "lucide-react";

const ProjectIconSelect = () => {
  const { project } = useAppData();
  const { updateProject, isPending } = useUpdateProject();
  const [open, setOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(
    project?.icon_name || "Code2",
  );
  const [iconColorFg, setIconColorFg] = useState(
    project?.icon_color_fg || "#000000",
  );
  const [iconColorBg, setIconColorBg] = useState(
    project?.icon_color_bg || "#FFFFFF",
  );

  // Update state when project changes
  useEffect(() => {
    if (project) {
      setSelectedIcon(project.icon_name || "Code2");
      setIconColorFg(project.icon_color_fg || "#000000");
      setIconColorBg(project.icon_color_bg || "#FFFFFF");
    }
  }, [project]);

  const handleSelectIcon = (iconName: string) => {
    setSelectedIcon(iconName);

    // Save to database when icon is selected
    if (project) {
      updateProject(project.id, { icon_name: iconName });
    }

    setOpen(false);
  };

  const handleColorChange = (type: "fg" | "bg", color: string) => {
    if (type === "fg") {
      setIconColorFg(color);
      if (project) {
        updateProject(project.id, { icon_color_fg: color });
      }
    } else {
      setIconColorBg(color);
      if (project) {
        updateProject(project.id, { icon_color_bg: color });
      }
    }
  };

  const SelectedIconComponent =
    icons.find(icon => icon.name === selectedIcon)?.component || Code2;

  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-gray-500 dark:text-gray-400">
        Project Icon
      </label>
      <div className="flex items-center space-x-3">
        <div
          className="flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center"
          style={{ backgroundColor: iconColorBg }}
        >
          <SelectedIconComponent
            className="h-5 w-5"
            style={{ color: iconColorFg }}
          />
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center justify-between flex-1"
              disabled={isPending}
            >
              <div className="flex items-center">
                <span className="text-sm">{selectedIcon}</span>
              </div>
              <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" align="start">
            <div className="space-y-3">
              <div className="max-h-[240px] overflow-y-auto p-2">
                <div className="grid grid-cols-5 gap-2">
                  {icons.map(icon => {
                    const IconComponent = icon.component;
                    return (
                      <div
                        key={icon.name}
                        onClick={() => handleSelectIcon(icon.name)}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 cursor-pointer rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                          selectedIcon === icon.name &&
                            "bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600",
                        )}
                        title={icon.name}
                      >
                        <IconComponent
                          className="h-5 w-5"
                          style={{ color: iconColorFg }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 p-2 border-t pt-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium flex-shrink-0 w-16">
                    Icon Color:
                  </label>
                  <input
                    type="color"
                    value={iconColorFg}
                    onChange={e => handleColorChange("fg", e.target.value)}
                    className="w-12 h-6"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium flex-shrink-0 w-16">
                    Background:
                  </label>
                  <input
                    type="color"
                    value={iconColorBg}
                    onChange={e => handleColorChange("bg", e.target.value)}
                    className="w-12 h-6"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ProjectIconSelect;
