import { ParsedDemoData, getDemoDataFromPath } from "@/data/demo.util";
import useIsMounted from "@/hooks/useIsMounted";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const useDemoData = (): ParsedDemoData => {
  const isMounted = useIsMounted();
  const pathname = usePathname();
  const demoData = useMemo(() => getDemoDataFromPath(pathname), [pathname]);
  if (!isMounted)
    return {
      task: null,
      project: null,
      profile: null,
      projects: [],
      notifications: [],
    };
  return { ...demoData, project: demoData.project };
};

export default useDemoData;
