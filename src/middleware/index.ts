import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

/**
 * Public paths accessible without authentication
 * Includes landing page and all auth-related pages
 */
const PUBLIC_PATHS = ["/", "/auth/signup", "/auth/login", "/auth/forgot-password", "/auth/reset-password"];

/**
 * Auth-specific paths (subset of PUBLIC_PATHS)
 * Logged-in users will be redirected from these to dashboard
 */
const AUTH_PATHS = ["/auth/signup", "/auth/login", "/auth/forgot-password", "/auth/reset-password"];

/**
 * Authentication middleware
 *
 * Responsibilities:
 * 1. Create Supabase client and verify user session
 * 2. Set Astro.locals.user for authenticated requests
 * 3. Redirect logged-in users from auth pages to dashboard
 * 4. Redirect logged-in users from landing page to dashboard
 * 5. Redirect unauthenticated users from protected pages to login
 * 6. Skip auth check for API routes (they handle auth internally)
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const currentPath = context.url.pathname;

  // Create Supabase server client with proper cookie handling
  const supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  // Add Supabase client to context.locals for use in API routes and pages
  context.locals.supabase = supabase;

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Auth check error:", error);
  }

  // Set user in context.locals for use in protected pages and API routes
  if (user) {
    context.locals.user = {
      id: user.id,
      email: user.email!,
    };
  } else {
    context.locals.user = null;
  }

  // Skip redirect logic for API routes (they handle auth internally via verifyAuth)
  if (currentPath.startsWith("/api/")) {
    return next();
  }

  // Redirect authenticated users from auth pages to dashboard
  if (user && AUTH_PATHS.includes(currentPath)) {
    return context.redirect("/dashboard");
  }

  // Redirect authenticated users from landing page to dashboard
  if (user && currentPath === "/") {
    return context.redirect("/dashboard");
  }

  // Redirect unauthenticated users from protected pages to login
  if (!user && !PUBLIC_PATHS.includes(currentPath)) {
    return context.redirect("/auth/login");
  }

  return next();
});
