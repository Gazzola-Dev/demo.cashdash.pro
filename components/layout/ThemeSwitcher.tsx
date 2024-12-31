import { useSidebar } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import useDarkMode from "@/hooks/useDarkMode";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";

export function ThemeSwitcher() {
  const { open } = useSidebar();
  const [isDarkMode, toggleDarkMode] = useDarkMode();

  return (
    <div
      className={cn(
        "flex items-center px-3 py-2 mb-2 cursor-pointer",
        "transition-all duration-200 ease-in-out",
        open ? "justify-between w-full" : "flex-col gap-2",
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
      {open && (
        <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
      )}
      <div className={cn("flex items-center gap-2", !open && "flex-col")}>
        <Switch
          checked={isDarkMode}
          onCheckedChange={toggleDarkMode}
          className={cn(!open && "rotate-90 my-4")}
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
