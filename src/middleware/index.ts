import { defineMiddleware } from "astro:middleware";

import { supabaseClient, supabaseServiceClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware((context, next) => {
  // Use service role client when SKIP_AUTH is enabled (bypasses RLS for development)
  // Otherwise use standard anon client (enforces RLS)
  const skipAuth = import.meta.env.SKIP_AUTH === "true";
  context.locals.supabase = skipAuth ? supabaseServiceClient : supabaseClient;

  return next();
});
