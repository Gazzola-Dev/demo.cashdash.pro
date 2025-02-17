import { ParsedDemoData, getDemoDataFromPath } from "@/data/demo.util";
import useIsMounted from "@/hooks/useIsMounted";
import { ProjectWithDetails } from "@/types/project.types";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

const useDemoData = (): ParsedDemoData => {
  const [currentProject, setCurrentProject] =
    useState<ProjectWithDetails | null>(null);
  const isMounted = useIsMounted();
  const pathname = usePathname();
  const demoData = useMemo(() => getDemoDataFromPath(pathname), [pathname]);
  if (!isMounted)
    return {
      task: null,
      project: null,
      profile: null,
      projects: [],
    };
  return { ...demoData, project: demoData.project || currentProject };
};

export default useDemoData;
