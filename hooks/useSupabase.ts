"use client";

import getSupabaseBrowserClient from "@/clients/browser-client";
import { useMemo } from "react";

function useSupabase() {
  return useMemo(() => {
    try {
      return getSupabaseBrowserClient();
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error);
      return null;
    }
  }, []);
}

export default useSupabase;
