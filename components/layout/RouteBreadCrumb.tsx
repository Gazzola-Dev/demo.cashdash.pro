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
  customPath?: string;
  className?: string;
  layoutData?: LayoutData;
}

export const RouteBreadcrumb = ({
  customPath,
  className,
  layoutData,
}: RouteBreadcrumbProps) => {
  const pathname = usePathname();
  const path = customPath || pathname;
  const segments = path.split("/").filter(Boolean);

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">{/* Here */}</BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;

          return (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem key={href}>
                {isLast ? (
                  <BreadcrumbPage>
                    {segment.charAt(0).toUpperCase() + segment.slice(1)}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>
                    {segment.charAt(0).toUpperCase() + segment.slice(1)}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default RouteBreadcrumb;
