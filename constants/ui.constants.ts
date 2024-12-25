import configuration from "@/configuration";
import { Code2, LifeBuoy, Send, Settings2 } from "lucide-react";

export const layoutData = {
  teams: [
    {
      name: "Acme Inc",
      slug: "acme",
      logo: Code2,
      plan: "Pro Plan",
    },
    {
      name: "Monster Inc",
      slug: "monster",
      logo: Code2,
      plan: "Team Plan",
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: configuration.paths.settings.all,
      icon: Settings2,
    },
    {
      title: "Support",
      url: configuration.paths.support,
      icon: LifeBuoy,
    },
    {
      title: "feedback",
      url: configuration.paths.feedback,
      icon: Send,
    },
  ],
  recentTasks: [
    {
      title: "Update landing page",
      url: configuration.paths.tasks.view({
        project_slug: "acme",
        task_slug: "landing-page",
      }),
    },
    {
      title: "Fix mobile navigation",
      url: configuration.paths.tasks.view({
        project_slug: "acme",
        task_slug: "mobile-nav",
      }),
    },
  ],
  taskActions: [
    {
      title: "View All Tasks",
      url: configuration.paths.tasks.all({ project_slug: "acme" }),
    },
    {
      title: "Create New Task",
      url: configuration.paths.tasks.new({ project_slug: "acme" }),
    },
  ],
  user: {
    name: "John Doe",
    email: "john@example.com",
    avatar: "/avatar.png",
  },
};
