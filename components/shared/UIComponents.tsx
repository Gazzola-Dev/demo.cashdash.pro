import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { LucideIcon, Moon, Sun } from "lucide-react";

interface NavItemProps {
  item: {
    title: string;
    path: string;
    icon?: LucideIcon;
    items?: { title: string; path: string }[];
  };
}

export function NavItemWithSub({ item }: NavItemProps) {
  const Icon = item.icon;

  return item.items ? (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          {Icon && <Icon className="mr-2 h-4 w-4" />}
          {item.title}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1">
        {item.items.map(subItem => (
          <Button
            key={subItem.path}
            variant="ghost"
            className="ml-6 w-full justify-start"
            asChild
          >
            <a href={subItem.path}>{subItem.title}</a>
          </Button>
        ))}
      </CollapsibleContent>
    </Collapsible>
  ) : (
    <Button variant="ghost" className="w-full justify-start" asChild>
      <a href={item.path}>
        {Icon && <Icon className="mr-2 h-4 w-4" />}
        {item.title}
      </a>
    </Button>
  );
}

export function Logo() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
      <span className="text-lg font-bold text-primary-foreground">A</span>
    </div>
  );
}

export function ThemeToggle() {
  return (
    <Button variant="ghost" size="icon">
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
