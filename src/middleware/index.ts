import { defineMiddleware } from "astro:middleware";

import { supabaseClient, supabaseServiceClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  // Use service role client when SKIP_AUTH is enabled (bypasses RLS for development)
  // Otherwise use standard anon client (enforces RLS)
  const skipAuth = import.meta.env.SKIP_AUTH === "true";
  context.locals.supabase = skipAuth ? supabaseServiceClient : supabaseClient;

  // Redirect logged-in users from landing page to dashboard
  const { data: { user }, error } = await context.locals.supabase.auth.getUser();

  if (error) {
    // Log error server-side but fail-safe: continue to next (show landing page)
    console.error('Auth check error:', error);
  }

  if (user && context.url.pathname === '/') {
    return context.redirect('/dashboard');
  }

  return next();
});
