import { createClient } from "@supabase/supabase-js";
import { useMemo } from "react";
import invariant from "tiny-invariant";

function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  invariant(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL is required");
  invariant(supabaseAnonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required");

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

function useSupabase() {
  return useMemo(() => {
    try {
      return getSupabaseBrowserClient();
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error);
      // Return null or handle the error appropriately
      return null;
    }
  }, []);
}

export default useSupabase;
