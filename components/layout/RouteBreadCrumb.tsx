"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import configuration from "@/configuration";
import { useGetProfile } from "@/hooks/profile.hooks";
import { useListTasks } from "@/hooks/task.hooks";
import { capitalizeFirstLetter, truncateString } from "@/lib/string.util";
import { Home } from "lucide-react";
import { usePathname } from "next/navigation";

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export default function RouteBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const { data } = useGetProfile();
  const { data: profileData } = useGetProfile();
  const { data: tasks } = useListTasks({
    projectSlug: segments[0],
    sort: "ordinal_id",
    order: "asc",
  });

  if (!segments.length)
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
              {profileData?.profile.display_name || "Sign in"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );

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
    const project = data?.projects?.find(p => p.project.slug === projectSlug);
    const projectName = truncateString(
      capitalize(project ? project.project.name : projectSlug),
    );

    // Handle task view route
    // Handle project-specific routes
    if (segments.length >= 1) {
      const projectSlug = segments[0];
      const project = data?.projects.find(p => p.project.slug === projectSlug);
      const projectName = truncateString(
        capitalize(project ? project.project.name : projectSlug),
      );

      // Handle task view route
      if (
        segments.length === 2 &&
        !["timeline", "kanban", "tasks"].includes(segments[1])
      ) {
        const task = tasks?.find(t => t.task?.slug.includes(segments[1]));
        return (
          <Breadcrumb className="flex-grow">
            <BreadcrumbList className="h-full !gap-0">
              <BreadcrumbItem className="h-full">
                <BreadcrumbLink
                  href={`/${projectSlug}`}
                  className="h-full flex items-center px-2"
                >
                  {projectName}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="h-full flex items-center" />
              <BreadcrumbItem className="h-full">
                <BreadcrumbLink
                  href={`/${projectSlug}/tasks`}
                  className="h-full flex items-center px-2"
                >
                  Tasks
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="h-full flex items-center" />
              <BreadcrumbItem className="h-full">
                <BreadcrumbPage className="h-full flex items-center px-2">
                  {task
                    ? `${project?.project.prefix || "Task"}-${task.task?.ordinal_id}: ${capitalizeFirstLetter(task.task.title)}`
                    : segments[1]}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        );
      }
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
