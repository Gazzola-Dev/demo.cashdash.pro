import { Slugs } from "@/types/nav.types";

const production = process.env.NODE_ENV === "production";

export const firstRouteSegments = [
  "404",
  "about",
  "feedback",
  "privacy",
  "projects",
  "settings",
  "support",
  "terms",
];

export const secondRouteSegments = [
  "deployments",
  "ai",
  "contracts",
  "timeline",
  "kanban",
  "tasks",
  "new",
  "billing",
  "profile",
  "notifications",
  "team",
];

export const thirdRouteSegments = ["new"];

const configuration = {
  site: {
    name: "Cash Dash Pro",
    description:
      "CashDash.Pro is a developer-focused task management platform that integrates GitHub activity with financial tracking, providing real-time insights into project progress, budget alignment, and development metrics through AI-powered analysis.",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    twitterHandle: "",
    instagramHandle: "",
    facebookHandle: "",
    youtubeHandle: "",
  },
  paths: {
    appHome: "/",
    project: {
      deployments: ({ project_slug = "" }: Slugs) =>
        `/${project_slug}/deployments`,
      ai: ({ project_slug = "" }: Slugs) => `/${project_slug}/ai`,
      contracts: ({ project_slug = "" }: Slugs) => `/${project_slug}/contracts`,
      view: ({ project_slug = "" }: Slugs) => `/${project_slug}`,
      timeline: ({ project_slug = "" }: Slugs) => `/${project_slug}/timeline`,
      kanban: ({ project_slug = "" }: Slugs) => `/${project_slug}/kanban`,
      all: "/projects",
      new: "/projects/new",
    },
    tasks: {
      all: ({ project_slug = "" }: Slugs) => `/${project_slug}/tasks`,
      new: ({ project_slug = "" }: Slugs) => `/${project_slug}/tasks/new`,
      view: ({ project_slug = "", task_slug = "" }: Slugs) =>
        `/${project_slug}/${task_slug}`,
    },
    settings: {
      all: "/settings",
      new: "/settings/billing",
      profile: "/settings/profile",
      notifications: "/settings/notifications",
      billing: "/settings/billing",
      team: "/settings/team",
    },
    support: "/support",
    feedback: "/feedback",
    privacy: "/privacy",
    terms: "/terms",
    notFound: "/404",
    about: "/about",
  },
  production,
};

export default configuration;
