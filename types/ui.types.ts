import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export interface User {
  name: string;
  email: string;
  avatar: string;
}

export interface Team {
  name: string;
  slug: string;
  logo: LucideIcon;
  plan: string;
}

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface DashboardItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface TaskItem {
  title: string;
  url: string;
}

export interface ActionItem {
  title: string;
  url: string;
}

export interface NavMainProps {
  items: {
    title: string;
    items: DashboardItem[];
  }[];
}

export interface TeamSwitcherProps {
  teams: Team[];
}

export interface NavSecondaryProps {
  items: NavItem[];
  className?: string;
}

export interface NavUserProps {
  user: User;
}

export interface AppLayoutProps {
  children: ReactNode;
}

export interface AppData {
  user: User;
  teams: Team[];
  navMain: {
    title: string;
    items: DashboardItem[];
  }[];
  recentTasks: TaskItem[];
  taskActions: ActionItem[];
  navSecondary: NavItem[];
  projectActions: ActionItem[];
}
