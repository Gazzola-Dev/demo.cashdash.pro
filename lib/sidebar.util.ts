// utils/sidebar.ts
import { usePathname } from "next/navigation";

export function useIsActivePath(path: string): boolean {
  const pathname = usePathname();

  // Handle dynamic route segments
  if (path.includes("[") && path.includes("]")) {
    // Convert [param] pattern to regex-friendly pattern
    const routePattern = path
      .replace(/\[([^\]]+)\]/g, "[^/]+") // Replace [param] with regex pattern
      .replace(/\//g, "\\/"); // Escape forward slashes

    const regex = new RegExp(`^${routePattern}$`);
    return regex.test(pathname);
  }

  // Exact match for static routes
  return pathname === path;
}

export function useIsActiveRoute(route: string | RegExp): boolean {
  const pathname = usePathname();

  if (route instanceof RegExp) {
    return route.test(pathname);
  }

  if (route.startsWith("^")) {
    return new RegExp(route).test(pathname);
  }

  return pathname.startsWith(route);
}
