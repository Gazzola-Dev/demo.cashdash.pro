"use client";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link2 } from "lucide-react";
import { useState } from "react";

interface DemoEvent {
  route: string;
  step: number;
  elementId: string;
  label: string;
}

const demoSteps: DemoEvent[] = [
  {
    route: "/",
    step: 1,
    elementId: "welcome",
    label:
      "Welcome to CashDash.Pro - Your AI-powered project management platform",
  },
  {
    route: "/projects/new",
    step: 2,
    elementId: "create-project",
    label: "Create your first project with GitHub integration",
  },
  {
    route: "/[project_slug]",
    step: 3,
    elementId: "project-overview",
    label: "View project dashboard with key metrics",
  },
  {
    route: "/[project_slug]/tasks/new",
    step: 4,
    elementId: "create-task",
    label: "Create and manage tasks with AI assistance",
  },
  {
    route: "/[project_slug]/invite",
    step: 5,
    elementId: "invite-team",
    label: "Invite team members to collaborate",
  },
  {
    route: "/[project_slug]/tasks",
    step: 6,
    elementId: "task-list",
    label: "Browse and filter project tasks",
  },
  {
    route: "/[project_slug]/kanban",
    step: 7,
    elementId: "kanban-view",
    label: "Use Kanban board for visual task management",
  },
  {
    route: "/[project_slug]/timeline",
    step: 8,
    elementId: "timeline-view",
    label: "View project timeline and progress",
  },
  {
    route: "/[project_slug]/[task_slug]",
    step: 9,
    elementId: "task-detail",
    label: "Deep dive into task details and updates",
  },
  {
    route: "/settings/profile",
    step: 10,
    elementId: "profile-settings",
    label: "Configure your profile and preferences",
  },
  {
    route: "/settings/team",
    step: 11,
    elementId: "team-settings",
    label: "Manage team roles and permissions",
  },
  {
    route: "/settings/billing",
    step: 12,
    elementId: "billing-settings",
    label: "Review project budgets and billing",
  },
  {
    route: "/feedback",
    step: 13,
    elementId: "feedback",
    label: "Provide feedback and feature requests",
  },
  {
    route: "/support",
    step: 14,
    elementId: "support",
    label: "Access support and documentation",
  },
  {
    route: "/about",
    step: 15,
    elementId: "about",
    label: "Learn more about CashDash.Pro features",
  },
];

const DemoHeader = () => {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className=" w-full bg-amber-200/5 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800">
      <div className="flex items-center justify-between px-4 h-5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
                asChild
              >
                <a
                  href="https://cashdash.pro"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Link2 className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Visit CashDash.Pro</TooltipContent>
          </Tooltip>

          <div className="flex-1 flex items-center justify-between mx-8">
            {demoSteps.map(step => (
              <Tooltip key={step.elementId}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() =>
                      setActiveStep(activeStep === step.step ? null : step.step)
                    }
                    className={`rounded-full bg-amber-300 dark:bg-amber-700 transition-all duration-200
                      ${activeStep === step.step ? "w-3 h-3" : "w-2 h-2"}
                      hover:w-3 hover:h-3`}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">{step.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
                asChild
              >
                <a
                  href="https://cashdash.pro"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Link2 className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Visit CashDash.Pro</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default DemoHeader;
