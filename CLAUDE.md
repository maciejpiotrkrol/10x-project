# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Athletica is an AI-powered running training plan generator. It creates personalized 10-week training plans based on user goals, fitness level, and personal data. The application targets amateur runners seeking an easy way to create tailored training plans.

## Development Commands

### Running the application

```bash
npm run dev           # Start development server on http://localhost:3000
npm run build         # Build for production
npm run preview       # Preview production build locally
```

### Code quality

```bash
npm run lint          # Check for linting issues
npm run lint:fix      # Fix linting issues automatically
npm run format        # Format code with Prettier
```

### Prerequisites

- Node.js version 22.14.0 (use nvm to manage versions)
- Environment variables in .env file (copy from .env.example):
  - SUPABASE_URL
  - SUPABASE_KEY
  - OPENROUTER_API_KEY

### Git hooks

- Pre-commit hook runs lint-staged automatically
- Staged files are linted and formatted before commit

## Architecture

### Tech Stack

- **Frontend**: Astro 5 with React 19 for interactive components
- **Language**: TypeScript 5
- **Styling**: Tailwind 4 + Shadcn/ui component library
- **Backend**: Supabase (PostgreSQL + Auth + BaaS)
- **AI**: OpenRouter.ai for accessing AI models
- **Build**: Server-side rendering (SSR) mode with Node adapter

### Project Structure

```
./src/
  layouts/              # Astro layouts
  pages/                # Astro pages (file-based routing)
    api/                # API endpoints (POST, GET handlers)
  middleware/index.ts   # Astro middleware (adds Supabase to context)
  db/                   # Supabase client setup and database types
  types.ts              # Shared types (Entities, DTOs)
  components/           # Astro (static) and React (interactive) components
    ui/                 # Shadcn/ui components
  lib/                  # Services and helper functions
  assets/               # Internal static assets
  styles/               # Global CSS
./public/               # Public static assets
./supabase/
  migrations/           # Database migration files
  config.toml           # Supabase configuration
```

### Key Architectural Patterns

**Astro + React Hybrid**

- Use .astro files for static content and layouts
- Use React (.tsx) only when client-side interactivity is needed
- Never use Next.js directives like "use client"

**Supabase Integration**

- Access Supabase via `context.locals.supabase` in Astro routes (not direct import)
- Middleware injects Supabase client into every request
- Use SupabaseClient type from `src/db/supabase.client.ts`
- Database types are in `src/db/database.types.ts`

**API Routes**

- Located in `src/pages/api/`
- Use uppercase method handlers (POST, GET)
- Add `export const prerender = false` for SSR endpoints
- Use Zod for input validation
- Extract business logic to `src/lib/` services

**Styling**

- Tailwind utility-first approach
- Path aliases configured: `@/*` maps to `./src/*`
- Shadcn/ui components in "new-york" style with lucide icons

### Database Migrations

**Creating migrations**

- Files go in `supabase/migrations/`
- Naming: `YYYYMMDDHHmmss_description.sql` (UTC time)
- Example: `20240906123045_create_profiles.sql`

**Migration guidelines**

- Write lowercase SQL with thorough comments
- Always enable Row Level Security (RLS) for new tables
- Create granular RLS policies per operation (select, insert, update, delete)
- Separate policies for `anon` and `authenticated` roles
- Document destructive operations (DROP, TRUNCATE, ALTER)

## Coding Practices

### Error Handling

- Handle errors and edge cases at the beginning of functions
- Use early returns for error conditions
- Place happy path last for readability
- Avoid deeply nested if/else statements
- Use guard clauses for preconditions
- Implement proper error logging with user-friendly messages

### React Best Practices

- Use functional components with hooks
- Extract custom hooks to `src/components/hooks`
- Use React.memo() for expensive components
- Leverage React.lazy() and Suspense for code-splitting
- Use useCallback for event handlers passed to children
- Use useMemo for expensive calculations
- Use useId() for accessibility attributes
- Consider useOptimistic for optimistic UI updates
- Use useTransition for non-urgent state updates

### Accessibility

- Use semantic HTML before ARIA
- Apply ARIA landmarks (main, navigation, search)
- Use aria-expanded and aria-controls for expandable content
- Implement aria-live regions for dynamic updates
- Use aria-label/aria-labelledby for elements without visible labels
- Implement aria-current for current item indicators
- Avoid redundant ARIA on semantic HTML

### Astro Specific

- Use View Transitions API for smooth page transitions
- Leverage Server Endpoints for API routes
- Use Astro.cookies for server-side cookie management
- Access environment variables via import.meta.env
- Implement hybrid rendering where needed

## Important Context

**MVP Scope**
The application includes:

- User authentication (email/password, password reset)
- Multi-step survey for user data collection
- AI-powered 10-week training plan generation
- Chronological training plan view with day-by-day breakdown
- Mark workouts as completed/uncompleted
- Read-only user profile displaying survey data
- Legal disclaimer for plan generation

**Out of Scope for MVP**

- Import/export training plans
- Social sharing
- Third-party integrations (Strava, Garmin)
- Mobile apps (web-only)
- Editing individual workouts
- Workout notes
- Contextual AI tips on technique/diet/recovery

**Key Behaviors**

- New plans overwrite existing plans (with confirmation dialog)
- Plans start on generation date
- Rest days clearly marked as "Odpoczynek"
- No marking rest days as completed
- Congratulations popup after plan completion
