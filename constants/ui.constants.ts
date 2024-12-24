import { AppData } from "@/types/ui.types";
import {
  BookOpen,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-react";

export const layoutData: AppData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/api/placeholder/32/32",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
      items: [
        { title: "Overview", url: "/dashboard" },
        { title: "Analytics", url: "/dashboard/analytics" },
      ],
    },
    {
      title: "Projects",
      url: "/projects",
      icon: Frame,
      items: [
        { title: "All Projects", url: "/projects" },
        { title: "New Project", url: "/projects/new" },
      ],
    },
    {
      title: "Documentation",
      url: "/docs",
      icon: BookOpen,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [
        { title: "Profile", url: "/settings/profile" },
        { title: "Team", url: "/settings/team" },
        { title: "Billing", url: "/settings/billing" },
      ],
    },
  ],
  navSecondary: [
    { title: "Support", url: "/support", icon: LifeBuoy },
    { title: "Feedback", url: "/feedback", icon: Send },
  ],
  projects: [
    { name: "Design System", url: "/projects/design", icon: Frame },
    { name: "Analytics", url: "/projects/analytics", icon: PieChart },
    { name: "Infrastructure", url: "/projects/infra", icon: Map },
  ],
};
