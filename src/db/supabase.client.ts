import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Standard client with anon key (enforces RLS)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Service role client for development (bypasses RLS)
// WARNING: Only use this in local development with SKIP_AUTH=true
export const supabaseServiceClient = supabaseServiceRoleKey
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey)
  : supabaseClient;
