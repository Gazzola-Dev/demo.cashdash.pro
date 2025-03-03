import { useSidebar } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import useDarkMode from "@/hooks/useDarkMode";
import { cn } from "@/lib/utils";
import { Eclipse, Moon, Sun } from "lucide-react";

export function ThemeSwitcher() {
  const { open } = useSidebar();
  const [isDarkMode, toggleDarkMode] = useDarkMode();

  if (!open) {
    return (
      <div
        className="flex items-center justify-center p-2 cursor-pointer rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
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
        {isDarkMode ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center px-3 cursor-pointer",
        "transition-all duration-200 ease-in-out justify-between w-full hover:bg-gray-100 dark:hover:bg-gray-800",
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
      <div className="flex items-center py-1 gap-4">
        <Eclipse className="size-4" />
        <span className="text-sm">Theme</span>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={isDarkMode}
          onCheckedChange={toggleDarkMode}
          className="bg-blue-800"
          onClick={e => e.stopPropagation()}
        />
        <Sun className={cn("size-4", isDarkMode ? "hidden" : "")} />
        <Moon className={cn("size-4", isDarkMode ? "" : "hidden")} />
      </div>
    </div>
  );
}

export default ThemeSwitcher;
