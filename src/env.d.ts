/// <reference types="astro/client" />

declare global {
  namespace App {
    interface Locals {
      /**
       * Authenticated user information
       * Set by middleware after successful authentication
       * null if user is not authenticated
       */
      user: {
        id: string;
        email: string;
      } | null;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
