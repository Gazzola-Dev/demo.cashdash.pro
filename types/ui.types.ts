import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export interface User {
  name: string;
  email: string;
  avatar: string;
}

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  items?: Array<{
    title: string;
    url: string;
  }>;
}

export interface Project {
  name: string;
  url: string;
  icon: LucideIcon;
}

export interface NavMainProps {
  items: NavItem[];
}

export interface NavProjectsProps {
  projects: Project[];
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
  navMain: NavItem[];
  navSecondary: NavItem[];
  projects: Project[];
}
