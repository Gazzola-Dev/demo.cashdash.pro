import getSupabaseBrowserClient from "@/clients/browser-client";
import { useMemo } from "react";

function useSupabase() {
  return useMemo(getSupabaseBrowserClient, []);
}

export default useSupabase;
