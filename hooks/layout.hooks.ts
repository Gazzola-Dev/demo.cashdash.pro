// layout.hooks.ts
"use client";

import { getLayoutDataAction } from "@/actions/layout.actions";
import { useQuery } from "@tanstack/react-query";

export const useLayoutData = (initialData?: any) => {
  return useQuery({
    queryKey: ["layout-data"],
    queryFn: async () => {
      const { data } = await getLayoutDataAction();
      return data;
    },
    initialData,
    staleTime: initialData ? 1000 * 60 : 0,
  });
};
