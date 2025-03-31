"use client";
import Logo from "@/components/SVG/Logo";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import configuration, {
  firstRouteSegments,
  secondRouteSegments,
} from "@/configuration";
import { capitalizeFirstLetter, truncateString } from "@/lib/string.util";
import { useAppData } from "@/stores/app.store";
import { usePathname } from "next/navigation";

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export default function RouteBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const { project, tasks, user } = useAppData();

  const homeBreadcrumb = !segments.length ? (
    <BreadcrumbItem className="h-full p-2">
      <Logo className="w-8 fill-blue-700 dark:fill-blue-400" />
    </BreadcrumbItem>
  ) : (
    <BreadcrumbItem className="h-full p-2">
      <BreadcrumbLink
        href={configuration.paths.appHome}
        className="h-full flex items-center justify-center"
      >
        <Logo className="w-8 fill-blue-700 dark:fill-blue-400" />
      </BreadcrumbLink>
    </BreadcrumbItem>
  );

  if (!user) return homeBreadcrumb;

  if (!segments.length)
    return (
      <Breadcrumb className="flex-grow">
        <BreadcrumbList className="h-full !gap-0">
          {homeBreadcrumb}
          <BreadcrumbSeparator className="h-full flex items-center" />
          <BreadcrumbItem className="h-full">
            <BreadcrumbPage className="h-full flex items-center px-2">
              {project?.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="h-full flex items-center" />
          <BreadcrumbItem className="h-full">
            <BreadcrumbPage className="h-full flex items-center px-2">
              Dashboard
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
          {homeBreadcrumb}
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
          {homeBreadcrumb}
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
          {homeBreadcrumb}
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

    const projectName = truncateString(capitalize(project?.name ?? ""));

    // Handle task view route
    if (
      segments.length === 2 &&
      !firstRouteSegments.includes(segments[0]) &&
      !secondRouteSegments.includes(segments[1])
    ) {
      const task = tasks.find(t => t?.slug?.includes(segments[1]));
      return (
        <Breadcrumb className="flex-grow">
          <BreadcrumbList className="h-full !gap-0">
            {homeBreadcrumb}
            <BreadcrumbSeparator className="h-full flex items-center" />
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
                  ? `${task?.ordinal_id}: ${capitalizeFirstLetter(task?.title ?? "")}`
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
          {homeBreadcrumb}
          <BreadcrumbSeparator className="h-full flex items-center" />
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
              {segments.length === 1 ? "Dashboard" : capitalize(segments[1])}
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
