import { Switch } from "@/components/ui/switch";
import useDarkMode from "@/hooks/useDarkMode";
import { cn } from "@/lib/utils";
import { Eclipse, Moon, Sun } from "lucide-react";

export function ThemeSwitcher() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();

  return (
    <div
      className={cn(
        "flex items-center px-3 pb-2 pt-4 cursor-pointer",
        "transition-all duration-200 ease-in-out justify-between w-full",
      )}
      onClick={toggleDarkMode}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleDarkMode();
        }
      }}
    >
      <div className="flex items-center gap-4">
        <Eclipse className={cn("size-4 text-gray-500 dark:text-gray-300")} />
        <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
      </div>

      <div className={cn("flex items-center gap-2", !open && "flex-col")}>
        <Switch
          checked={isDarkMode}
          onCheckedChange={toggleDarkMode}
          className={cn(!open && "rotate-90 my-4", "bg-blue-800")}
          onClick={e => e.stopPropagation()}
        />
        <Sun
          className={cn("size-4 text-gray-500", isDarkMode ? "hidden" : "")}
        />
        <Moon
          className={cn("size-4 text-gray-500", isDarkMode ? "" : "hidden")}
        />
      </div>
    </div>
  );
}

export default ThemeSwitcher;
