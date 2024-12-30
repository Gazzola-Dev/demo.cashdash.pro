import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import configuration from "@/configuration";
import { capitalizeFirstLetter, truncateString } from "@/lib/string.util";
import { LayoutData } from "@/types/layout.types";
import { Home } from "lucide-react";
import { usePathname } from "next/navigation";

interface RouteBreadcrumbProps {
  layoutData: LayoutData;
}

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export default function RouteBreadcrumb({ layoutData }: RouteBreadcrumbProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Simple routes with home icon
  const simpleRoutes = [
    "support",
    "feedback",
    "privacy",
    "terms",
    "404",
    "about",
  ];
  if (simpleRoutes.includes(segments[0])) {
    return (
      <Breadcrumb className="flex-grow">
        <BreadcrumbList className="h-full !gap-0">
          <BreadcrumbItem className="h-full">
            <BreadcrumbLink
              href={configuration.paths.appHome}
              className="h-full flex items-center px-3"
            >
              <Home className="size-[1.1rem]" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="h-full flex items-center" />
          <BreadcrumbItem className="h-full">
            <BreadcrumbPage className="capitalize h-full flex items-center px-2">
              {capitalize(segments[0])}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Handle settings routes
  if (pathname.startsWith("/settings")) {
    return (
      <Breadcrumb className="flex-grow">
        <BreadcrumbList className="h-full !gap-0">
          <BreadcrumbItem className="h-full">
            <BreadcrumbLink
              href={configuration.paths.appHome}
              className="h-full flex items-center px-3"
            >
              <Home className="size-[1.1rem]" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="h-full flex items-center" />
          <BreadcrumbItem className="h-full">
            {segments.length === 1 ? (
              <BreadcrumbPage className="capitalize h-full flex items-center px-2">
                Settings
              </BreadcrumbPage>
            ) : (
              <BreadcrumbLink
                href={configuration.paths.settings.all}
                className="h-full flex items-center px-2"
              >
                Settings
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {segments.length > 1 && (
            <>
              <BreadcrumbSeparator className="h-full flex items-center" />
              <BreadcrumbItem className="h-full">
                <BreadcrumbPage className="capitalize h-full flex items-center px-2">
                  {capitalize(segments[1])}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Handle projects routes
  if (pathname.startsWith("/projects")) {
    return (
      <Breadcrumb className="flex-grow">
        <BreadcrumbList className="h-full !gap-0">
          <BreadcrumbItem className="h-full">
            <BreadcrumbLink
              href={configuration.paths.appHome}
              className="h-full flex items-center px-3"
            >
              <Home className="size-[1.1rem]" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="h-full flex items-center" />
          <BreadcrumbItem className="h-full">
            {segments.length === 1 ? (
              <BreadcrumbPage className="capitalize h-full flex items-center px-2">
                Projects
              </BreadcrumbPage>
            ) : (
              <BreadcrumbLink
                href="/projects"
                className="h-full flex items-center px-2"
              >
                Projects
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {segments.length > 1 && (
            <>
              <BreadcrumbSeparator className="h-full flex items-center" />
              <BreadcrumbItem className="h-full">
                <BreadcrumbPage className="capitalize h-full flex items-center px-2">
                  New
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Handle project-specific routes
  if (segments.length >= 1) {
    const projectSlug = segments[0];
    const project = layoutData.projects.find(p => p.slug === projectSlug);
    const projectName = truncateString(
      capitalize(project ? project.name : projectSlug),
    );

    // Handle task view route
    if (
      segments.length === 2 &&
      !["timeline", "kanban", "tasks"].includes(segments[1])
    ) {
      const task = layoutData.recentTasks.find(t =>
        t.url.includes(segments[1]),
      );
      return (
        <Breadcrumb className="flex-grow">
          <BreadcrumbList className="h-full !gap-0">
            <BreadcrumbItem className="h-full">
              <BreadcrumbLink
                href={`/${projectSlug}`}
                className="h-full flex items-center"
              >
                {projectName}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="h-full flex items-center" />
            <BreadcrumbItem className="h-full">
              <BreadcrumbPage className="h-full flex items-center px-2">
                {task
                  ? `${project?.prefix || "Task"}-${task.ordinalId}: ${capitalizeFirstLetter(task.title)}`
                  : segments[1]}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
    }

    return (
      <Breadcrumb className="flex-grow">
        <BreadcrumbList className="h-full !gap-0">
          <BreadcrumbItem className="h-full">
            {segments.length === 1 ? (
              <BreadcrumbPage className="h-full flex items-center px-2">
                {projectName}
              </BreadcrumbPage>
            ) : (
              <BreadcrumbLink
                href={`/${projectSlug}`}
                className="h-full flex items-center px-2"
              >
                {projectName}
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          <BreadcrumbSeparator className="h-full flex items-center" />
          <BreadcrumbItem className="h-full">
            <BreadcrumbPage className="h-full flex items-center px-2">
              {segments.length === 1 ? "Overview" : capitalize(segments[1])}
            </BreadcrumbPage>
          </BreadcrumbItem>
          {segments.length > 2 && (
            <>
              <BreadcrumbSeparator className="h-full flex items-center" />
              <BreadcrumbItem className="h-full">
                <BreadcrumbPage className="h-full flex items-center px-2">
                  {segments[2] === "new" ? "New" : capitalize(segments[2])}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return null;
}
