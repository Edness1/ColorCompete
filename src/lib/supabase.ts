import { createClient } from "@supabase/supabase-js";
import { type Database } from "../types/supabase";

// Create a mock client for development when credentials are missing
const createMockClient = () => {
  console.warn(
    "Using mock Supabase client. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables for actual functionality.",
  );

  // Return a minimal mock client that won't throw errors
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
    }),
  } as unknown as ReturnType<typeof createClient<Database>>;
};

// Get environment variables with fallbacks to prevent runtime errors
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Initialize the Supabase client or use mock client if credentials are missing
export const supabase =
  !supabaseUrl || !supabaseAnonKey
    ? createMockClient()
    : createClient<Database>(supabaseUrl, supabaseAnonKey);
