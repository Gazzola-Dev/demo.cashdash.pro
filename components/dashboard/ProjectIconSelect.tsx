import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateProject } from "@/hooks/app.hooks";
import { icons } from "@/lib/iconList.util";
import { cn } from "@/lib/utils";
import { useAppData } from "@/stores/app.store";
import { ChevronDown, Code2 } from "lucide-react";

// Common colors used in the color picker
const colors = [
  "#000000",
  "#FFFFFF",
  "#F44336",
  "#E91E63",
  "#9C27B0",
  "#673AB7",
  "#3F51B5",
  "#2196F3",
  "#03A9F4",
  "#00BCD4",
  "#009688",
  "#4CAF50",
  "#8BC34A",
  "#CDDC39",
  "#FFEB3B",
  "#FFC107",
  "#FF9800",
  "#FF5722",
  "#795548",
  "#9E9E9E",
  "#607D8B",
];

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
      <Label className="text-sm font-bold text-gray-500 dark:text-gray-400">
        Project Icon
      </Label>
      <div className="flex items-center space-x-3">
        <div className="flex flex-1 gap-3">
          {/* Icon Picker */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center justify-between"
                disabled={isPending}
              >
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: iconColorBg }}
                >
                  <SelectedIconComponent
                    className=""
                    style={{
                      color: iconColorFg,
                      width: "1.5rem",
                      height: "1.5rem",
                      strokeWidth: 2,
                    }}
                  />
                </div>
                <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-72 p-2"
              align="start"
              style={{
                backgroundColor: iconColorBg,
              }}
            >
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
                            "flex flex-col items-center justify-center p-2 cursor-pointer rounded-md hover:bg-gray-100/20 dark:hover:bg-gray-800/20 transition-colors",
                            selectedIcon === icon.name &&
                              "bg-gray-100/30 dark:bg-gray-800/30 border border-gray-300 dark:border-gray-600/30",
                          )}
                          title={icon.name}
                        >
                          <IconComponent
                            className="h-7 w-7 p-1 rounded"
                            style={{
                              color: iconColorFg,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Foreground Color Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 px-2 flex items-center gap-2"
                style={{ borderColor: iconColorFg }}
              >
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: iconColorFg }}
                ></div>
                <span className="text-xs">Icon</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <Tabs defaultValue="palette">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="palette">Palette</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>
                <TabsContent value="palette" className="mt-2">
                  <div className="grid grid-cols-7 gap-1">
                    {colors.map(color => (
                      <button
                        key={`fg-${color}`}
                        className={cn(
                          "w-6 h-6 rounded-md border border-gray-200 dark:border-gray-700",
                          color === iconColorFg &&
                            "ring-2 ring-offset-2 ring-primary",
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorChange("fg", color)}
                      />
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="custom" className="mt-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="fg-color-input">Custom Color</Label>
                    <input
                      id="fg-color-input"
                      type="color"
                      value={iconColorFg}
                      onChange={e => handleColorChange("fg", e.target.value)}
                      className="w-full h-8"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>

          {/* Background Color Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 px-2 flex items-center gap-2"
                style={{ borderColor: iconColorBg }}
              >
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: iconColorBg }}
                ></div>
                <span className="text-xs">Background</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <Tabs defaultValue="palette">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="palette">Palette</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>
                <TabsContent value="palette" className="mt-2">
                  <div className="grid grid-cols-7 gap-1">
                    {colors.map(color => (
                      <button
                        key={`bg-${color}`}
                        className={cn(
                          "w-6 h-6 rounded-md border border-gray-200 dark:border-gray-700",
                          color === iconColorBg &&
                            "ring-2 ring-offset-2 ring-primary",
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorChange("bg", color)}
                      />
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="custom" className="mt-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="bg-color-input">Custom Color</Label>
                    <input
                      id="bg-color-input"
                      type="color"
                      value={iconColorBg}
                      onChange={e => handleColorChange("bg", e.target.value)}
                      className="w-full h-8"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default ProjectIconSelect;
