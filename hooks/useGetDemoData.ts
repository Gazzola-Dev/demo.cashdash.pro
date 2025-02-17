import { ParsedDemoData, getDemoDataFromPath } from "@/data/demo.util";
import useIsMounted from "@/hooks/useIsMounted";
import { usePathname } from "next/navigation";

const useGetDemoData = (): ParsedDemoData => {
  const isMounted = useIsMounted();
  const pathname = usePathname();
  if (!isMounted)
    return {
      task: null,
      project: null,
    };
  return getDemoDataFromPath(pathname);
};

export default useGetDemoData;
