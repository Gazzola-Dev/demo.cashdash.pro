// components/layout/RouteBreadcrumb.tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { LayoutData } from "@/types/layout.types";
import { usePathname } from "next/navigation";

interface RouteBreadcrumbProps {
  layoutData: LayoutData;
}

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export default function RouteBreadcrumb({ layoutData }: RouteBreadcrumbProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Handle settings routes
  if (pathname.startsWith("/settings")) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">
              {capitalize(segments[0])}
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.length > 1 && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="capitalize">
                  {capitalize(segments[1])}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Handle projects and tasks list/new routes
  if (pathname.startsWith("/projects") || pathname.startsWith("/tasks")) {
    const baseRoute = segments[0];
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${baseRoute}`} className="capitalize">
              {capitalize(baseRoute)}
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.length > 1 && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="capitalize">
                  {capitalize(segments[1])}
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
    const prefix = project?.prefix || projectSlug;

    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${projectSlug}`}>
              {capitalize(prefix)}
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.length > 1 && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {segments.length > 2 ? (
                  <BreadcrumbLink href={`/${projectSlug}/${segments[1]}`}>
                    {capitalize(segments[1])}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>
                    {segments[1] === "timeline"
                      ? "Timeline"
                      : segments[1] === "kanban"
                        ? "Kanban"
                        : "Overview"}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </>
          )}
          {segments.length > 2 && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{capitalize(segments[2])}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return null;
}
