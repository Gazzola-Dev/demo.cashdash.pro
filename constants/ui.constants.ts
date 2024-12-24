import { AppData } from "@/types/ui.types";
import {
  Calendar,
  Frame,
  KanbanSquare,
  LayoutDashboard,
  LifeBuoy,
  Send,
  Settings2,
} from "lucide-react";

const placeholderTasks = [
  { id: "task-1", title: "Implement user authentication system" },
  { id: "task-2", title: "Design new dashboard layout" },
  { id: "task-3", title: "Fix responsive layout issues" },
  { id: "task-4", title: "Update API documentation" },
];

const teams = [
  {
    name: "Acme Corp",
    slug: "acme-corp",
    logo: Frame,
    plan: "Pro Plan",
  },
  {
    name: "Startup Inc",
    slug: "startup-inc",
    logo: Frame,
    plan: "Free Plan",
  },
  {
    name: "Tech Solutions",
    slug: "tech-solutions",
    logo: Frame,
    plan: "Team Plan",
  },
];

export const layoutData: AppData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/api/placeholder/32/32",
  },
  teams,
  navMain: [
    {
      title: "Dashboard",
      items: [
        { title: "Overview", url: "/overview", icon: LayoutDashboard },
        { title: "Calendar", url: "/calendar", icon: Calendar },
        { title: "Kanban", url: "/kanban", icon: KanbanSquare },
      ],
    },
  ],
  recentTasks: placeholderTasks.map(task => ({
    title: task.title,
    url: `/tasks/${task.id}`,
  })),
  taskActions: [
    { title: "New Task", url: "/tasks/new" },
    { title: "All Tasks", url: "/tasks" },
  ],
  navSecondary: [
    { title: "Settings", url: "/settings", icon: Settings2 },
    { title: "Support", url: "/support", icon: LifeBuoy },
    { title: "Feedback", url: "/feedback", icon: Send },
  ],
  projectActions: [
    { title: "All Projects", url: "/projects" },
    { title: "New Project", url: "/projects/new" },
  ],
};
