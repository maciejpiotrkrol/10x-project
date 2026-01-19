// @ts-check
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// Load environment variables based on mode
// Check if --mode test is passed in CLI arguments
const isTestMode = process.argv.includes("--mode") && process.argv[process.argv.indexOf("--mode") + 1] === "test";
const mode = isTestMode ? "test" : (process.env.NODE_ENV || "development");
const env = loadEnv(mode, process.cwd(), "");

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  devToolbar: {
    enabled: !isTestMode, // Disable dev toolbar in test mode to prevent click interception
  },
  vite: {
    plugins: [tailwindcss()],
    define: {
      // Make env variables available in import.meta.env
      "import.meta.env.SUPABASE_URL": JSON.stringify(
        env.SUPABASE_URL || process.env.SUPABASE_URL
      ),
      "import.meta.env.SUPABASE_KEY": JSON.stringify(
        env.SUPABASE_KEY || process.env.SUPABASE_KEY
      ),
      "import.meta.env.OPENROUTER_API_KEY": JSON.stringify(
        env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY
      ),
    },
  },
  adapter: node({
    mode: "standalone",
  }),
});
