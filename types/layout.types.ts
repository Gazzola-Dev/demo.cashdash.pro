import { Tables } from "@/types/database.types";
import { RequiredProject, TaskWithProject } from "@/types/task.types";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

// Base database types
type Project = Tables<"projects">;
type Task = Tables<"tasks">;
type Profile = Tables<"profiles">;

// Layout-specific project type
export interface LayoutProject {
  id: Project["id"];
  name: Project["name"];
  slug: Project["slug"];
  status: Project["status"];
  prefix: Project["prefix"];
  isCurrent?: boolean;
  logo?: LucideIcon;
  role?: string;
}

// Layout-specific task type that extends TaskWithProject
export interface LayoutTask extends Omit<TaskWithProject, "project"> {
  id: Task["id"];
  title: Task["title"];
  status: Task["status"];
  priority: Task["priority"];
  ordinalId: Task["ordinal_id"];
  prefix: Task["prefix"];
  url: string;
  project: {
    slug: RequiredProject["slug"];
    name: RequiredProject["name"];
    prefix: RequiredProject["prefix"];
  };
}

// Layout-specific user type
export interface LayoutUser {
  id: Profile["id"];
  name: string;
  email: string;
  avatar: Profile["avatar_url"];
}

// Navigation types
export interface NavigationItem {
  title: string;
  url: string;
  icon?: string | LucideIcon;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

// Layout data structure
export interface LayoutData {
  user: LayoutUser;
  currentProject?: LayoutProject;
  projects: LayoutProject[];
  recentTasks: LayoutTask[];
  priorityTasks: LayoutTask[];
  navSecondary: NavigationItem[];
}

// Component props types
export interface MainNavigationProps {
  items: NavigationSection[];
}

export interface ProjectSwitcherProps {
  projects: LayoutProject[];
  currentProject?: LayoutProject;
}

export interface TaskListProps {
  tasks: LayoutTask[];
  title?: string;
}

export interface LayoutProps {
  children: ReactNode;
  initialData?: LayoutData;
}

// Layout state types
export interface LayoutState extends LayoutData {
  initialized: boolean;
  sidebarOpen?: boolean;
  theme?: "light" | "dark";
}

export interface LayoutContextType extends LayoutState {
  setCurrentProject: (project: LayoutProject) => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
}
