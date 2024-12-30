// layout.types.ts
import { Tables } from "@/types/database.types";
import { LucideIcon } from "lucide-react";

export interface LayoutProject {
  id: string;
  name: string;
  slug: string;
  status: Tables<"projects">["status"];
  prefix: string;
  isCurrent?: boolean;
  logo?: LucideIcon;
  role?: string;
}

export interface LayoutTask {
  id: string;
  title: string;
  status: Tables<"tasks">["status"];
  priority: Tables<"tasks">["priority"];
  ordinalId: number;
  prefix: string;
  url: string;
  project: {
    slug: string;
    name: string;
  };
}

export interface LayoutUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface NavigationItem {
  title: string;
  url: string;
  icon?: string | LucideIcon;
}

export interface LayoutData {
  user: LayoutUser;
  currentProject?: LayoutProject;
  projects: LayoutProject[];
  recentTasks: LayoutTask[];
  priorityTasks: LayoutTask[];
  navSecondary: NavigationItem[];
}
