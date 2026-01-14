# UI Architecture Plan - Athletica MVP

## Overview

This document contains the complete UI architecture plan for Athletica MVP, an AI-powered running training plan generator. The plan was developed through an iterative process of questions and recommendations based on:

- Product Requirements Document (PRD)
- Technical Stack specifications
- API Plan
- Current codebase analysis

---

## Current State

### ✅ Implemented (Backend)
- Full REST API layer (7 endpoints)
- Supabase database (4 tables with RLS)
- AI integration (OpenRouter) for plan generation
- JWT authentication + Row Level Security
- Astro middleware with Supabase integration
- Zod validation for all endpoints

### ❌ Missing (Frontend)
- Authentication pages (login/signup/reset)
- Survey form (user onboarding)
- Dashboard with training plan display
- Workout interaction (mark as completed)
- User profile (read-only)
- Navigation and app layout
- User state management
- Most UI components (only 3 from Shadcn/ui: Button, Card, Avatar)

### Tech Stack
- **Frontend:** Astro 5 (SSR) + React 19 + TypeScript 5
- **Styling:** Tailwind CSS 4 + Shadcn/ui (new-york style)
- **Backend:** Supabase (PostgreSQL + Auth + BaaS)
- **AI:** OpenRouter.ai

---

## User Decisions Summary

### Round 1: Core Architecture Decisions

1. **Landing Page:** Simple landing page (/) with app description and CTA. Logged-in users auto-redirect to /dashboard.

2. **Onboarding Flow:** Separate registration from survey. After first login → redirect to /survey → automatic plan generation.

3. **Navigation:** Top navbar (Dashboard, Profile, New Plan, Logout) - sticky positioning. Universal for desktop/tablet/mobile.

4. **Survey Form:** **Single step - entire form at once** (not multi-step), divided into visual sections (Cards).

5. **70-Day Training List:** Chronological list grouped by weeks (Week 1-10) in Accordion (collapsible), auto-scroll to "today".

6. **Marking Workouts:** Optimistic UI update - immediate visual change, API request in background, rollback on error + toast notification.

7. **Profile Page:** Read-only display of last survey data + "Generate New Plan" button → redirect to /survey.

8. **State Management:** Hybrid approach:
   - Auth state: React Context Provider
   - Training plan: SSR (Astro) + React for interactivity
   - Survey: Local state + sessionStorage
   - No Zustand/Redux

9. **Overwriting Plan:** Confirmation dialog (Shadcn/ui Dialog) with clear info about losing current plan. Old plan: soft delete (is_active: false).

10. **Error & Loading Handling:** Multi-level strategy:
    - Loading: Skeleton loaders + button spinners + modal for AI generation
    - Errors: Simplified user-friendly messages (2 generic variants)
    - Error Boundary: Top-level fallback UI

### Round 2: Implementation Details

11. **Survey Form Layout:** Visual division into Cards: Training goals, Personal data, Personal records (dynamic), Disclaimer + checkbox. Validation: Real-time with Zod + React Hook Form.

12. **Landing Page Structure:** Single-page (not scrollable) with Hero section, CTA "Start for free", 3 icons (Goals/AI/Training). WITHOUT testimonials, pricing, long descriptions.

13. **Auto-scroll in Dashboard:** Smooth scroll to today's card (block: 'center'). FAB "↓ Today" in bottom right corner (no highlight border).

14. **Workout Descriptions Display:**
    - Collapsed: Truncated description (1 line) + status
    - Expanded: Full description + "Mark as completed" button
    - Do NOT use modals

15. **Visual Rest Day Marking:**
    - Rest: Muted background, icon 🛌, "Rest", disabled
    - Workout: Card background, active checkbox, border (green if completed)

16. **Empty States:**
    - No profile: Redirect to /survey, navbar only logo + logout
    - No plan: Empty State Card with CTA "Generate Plan"

17. **AI Generation Loading:** Modal with animated spinner, messages ("Analyzing...", "Creating plan...", "20-30 seconds"), NOT closable, timeout after **60 seconds**.

18. **Mobile Navigation:** Top navbar (logo) + Bottom navigation bar (3 icons: Dashboard, Profile, New Plan). Bottom bar hides on scroll down. Active state with accent color.

19. **Error Messages:** Simplified user-friendly:
    - "Something went wrong. Please try again."
    - "Failed to load data. Check your internet connection."

20. **Dark Mode:** **NO dark mode in MVP** - only one theme (light).

---

## Architecture Recommendations

### 1. Pages and Routing

**Public Pages:**
- `/` - Landing page
- `/auth/login` - Login
- `/auth/signup` - Registration
- `/auth/reset-password` - Password reset

**Protected Pages:**
- `/dashboard` - Main view with training plan
- `/survey` - Survey form
- `/profile` - User profile

### 2. Shadcn/ui Components to Add

- Input (text, number)
- Select/Dropdown
- Radio Group
- Checkbox
- Dialog/Modal
- Toast/Notification
- Accordion
- Skeleton Loader
- Progress (indeterminate)
- Badge (optional)

### 3. Component Hierarchy

```
src/
├── layouts/
│   ├── Layout.astro (main layout - exists)
│   ├── AuthLayout.astro (for auth pages)
│   └── DashboardLayout.astro (for dashboard + profile)
├── pages/
│   ├── index.astro (landing)
│   ├── auth/
│   │   ├── login.astro
│   │   ├── signup.astro
│   │   └── reset-password.astro
│   ├── dashboard.astro (SSR)
│   ├── survey.astro (SSR)
│   └── profile.astro (SSR)
├── components/
│   ├── Navbar.astro (top navigation)
│   ├── BottomNav.tsx (React, mobile bottom bar)
│   ├── AuthForm.tsx (React, login/signup)
│   ├── SurveyForm.tsx (React, survey)
│   ├── TrainingPlanView.tsx (React, day list)
│   ├── WeekAccordion.tsx (React, week in accordion)
│   ├── WorkoutDayCard.tsx (React, day card)
│   ├── ProfileView.tsx (React, read-only profile)
│   ├── EmptyState.tsx (React, no plan)
│   ├── LoadingModal.tsx (React, AI generation)
│   ├── ConfirmDialog.tsx (React, overwrite confirmation)
│   └── ui/ (Shadcn/ui components)
```

### 4. API Integration

- **SSR (Astro):** Fetch initial data server-side for dashboard/profile
- **Client-side (React):** Mutations (mark completed, generate plan, submit survey)
- **Optimistic updates:** For workout completion with rollback
- **Error handling:** Toast notifications + inline errors
- **Loading states:** Skeleton loaders + spinners

### 5. Auth Flow and Protected Routes

- Middleware checks auth status (Supabase JWT)
- Protected routes: redirect to `/auth/login` if not logged in
- After login: check if has profile → if not → `/survey`, if yes → `/dashboard`
- Auth Context Provider for React components

### 6. Responsiveness (Breakpoints)

- **Mobile:** < 768px (bottom nav bar, stack layout)
- **Tablet:** 768px - 1024px (top navbar, 2-col grid optional)
- **Desktop:** > 1024px (top navbar, max-width container)

---

## User Journey Maps

### New User Flow

```
Landing (/)
  → Registration (/auth/signup)
  → Automatic login
  → Survey (/survey)
  → AI Generation (loading modal 20-60s)
  → Dashboard with plan (/dashboard)
  → Mark workouts (optimistic update)
```

### Returning User Flow

```
Landing (/) → auto-redirect
  → Dashboard (/dashboard)
  → View plan
  → Mark as completed
  → [Optional] Profile (/profile)
  → [Optional] New Plan (/survey)
```

### New Plan Generation Flow

```
Dashboard or Profile
  → "New Plan" button
  → Survey (/survey) - pre-filled
  → Submit → Confirmation dialog (if active plan exists)
  → Confirm → AI Generation
  → Dashboard with new plan
```

---

## UI Patterns and Interactions

- **Cards:** Main pattern for grouping (survey sections, workout days, profile sections)
- **Accordion:** Weeks in dashboard (collapsible)
- **Optimistic UI:** Workout completion (instant feedback)
- **Modals:** Loading AI, Confirmation dialogs
- **Toasts:** Success/error notifications (non-intrusive)
- **Empty States:** No plan, no profile
- **FAB:** Floating Action Button for "Scroll to today"

---

## Detailed Implementation Sections

### State Management Strategy

**Auth State (React Context):**
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}
```
- Initialize with Supabase `getUser()` on mount
- Available to all React components
- Persist across navigation

**Training Plan Data:**
- SSR fetch in `/dashboard.astro`
- Pass as props to `<TrainingPlanView>`
- Local state for optimistic updates
- Revalidate on error (rollback)

**Survey Data:**
- Local React state (`useState`)
- Persist in `sessionStorage` (don't lose on refresh)
- Submit at end (POST /api/training-plans/generate)

**UI State:**
- Accordion expanded/collapsed (local component state)
- Modal open/closed (local component state)
- Toast notifications (local component state)

### Loading States

1. **Initial Page Load:**
   - Skeleton loaders for cards and lists
   - Show layout structure while loading

2. **Button Actions:**
   - Spinner inside button
   - Disabled state during request

3. **AI Generation:**
   - Modal with animated spinner
   - Progress messages:
     - "Analyzing your data..."
     - "Creating personalized plan..."
     - "This may take 20-30 seconds"
   - Progress bar (indeterminate)
   - NOT closable
   - Timeout after 60 seconds

### Error Handling

**Validation Errors (400):**
- Inline under form fields (red text)
- Real-time validation with Zod + React Hook Form

**API Errors:**
- "Something went wrong. Please try again."
- "Failed to load data. Check your internet connection."
- Toast notification with retry button

**Auth Errors (401):**
- Redirect to /auth/login
- Toast: "Session expired"

**Error Boundary:**
- Top-level React Error Boundary
- Fallback UI: "Something went wrong" + "Refresh page" button
- Log errors to console (production: Sentry optional)

**Empty States:**
- No profile: Automatic redirect to /survey
- No plan: Card with CTA "Generate Plan"

### Responsiveness Details

**Mobile (< 768px):**
- Stack layout (1 column)
- Top navbar: logo + hamburger (optional)
- Bottom navigation bar: 3 icons (Dashboard, Profile, New Plan)
- Bottom bar hides on scroll down, appears on scroll up
- Touch-friendly targets (min 44x44px)

**Tablet (768px - 1024px):**
- Top navbar (full)
- 1-2 columns (optional for wide cards)

**Desktop (> 1024px):**
- Top navbar (full)
- Max-width container (1280px)
- Centered content

### Accessibility

- Semantic HTML (nav, main, section, article)
- ARIA labels for interactive elements
- Keyboard navigation (Tab, Enter, Space)
- Focus-visible states (Shadcn/ui provides)
- Skip to content link (optional)
- Alt text for icons (if not decorative)

### Security

- JWT authentication (Supabase)
- Protected routes (middleware checks auth)
- Row Level Security (RLS) on database
- HTTPS only (production)
- HttpOnly cookies for JWT
- Input validation (Zod) + sanitization
- CSRF protection (Supabase handles)

---

## Implementation Plan (Priority Order)

### Phase 1: Foundation (Critical for MVP)
1. Add missing Shadcn/ui components (Input, Select, Dialog, Toast, Accordion, Skeleton)
2. Create layouts (AuthLayout, DashboardLayout)
3. Implement AuthProvider (React Context)
4. Create Navbar + BottomNav (mobile)

### Phase 2: Auth Flow
5. Login page (/auth/login) + AuthForm
6. Registration page (/auth/signup)
7. Password reset page (/auth/reset-password)
8. Protected routes middleware (redirect if not logged in)

### Phase 3: Core Features
9. Landing page (/) - simple hero + CTA
10. Survey (/survey) - SurveyForm (1 step, Cards, validation)
11. Loading modal (AI generation)
12. Dashboard (/dashboard) - TrainingPlanView + WeekAccordion + WorkoutDayCard
13. Optimistic update for workout completion

### Phase 4: Secondary Features
14. Profile (/profile) - ProfileView (read-only)
15. Empty states (no plan/no profile)
16. Confirm dialog (overwrite plan)
17. Auto-scroll to today + FAB

### Phase 5: Polish
18. Error handling (toast notifications, error boundary)
19. Responsiveness (mobile/tablet/desktop)
20. Accessibility audit (keyboard nav, ARIA)
21. Testing (manual + optional automated)

---

## Components to Implement

### Astro Components (Static)

**Layout.astro** (exists)
- Main layout with HTML structure
- Meta tags, favicon, global styles

**AuthLayout.astro** (new)
- Layout for auth pages (login/signup/reset)
- Centered form container
- No navbar (just logo)

**DashboardLayout.astro** (new)
- Layout for dashboard and profile
- Includes Navbar component
- Includes BottomNav for mobile
- Main content area

**Navbar.astro** (new)
- Logo + navigation links
- Desktop: Dashboard, Profile, New Plan, Logout
- Mobile: Logo + hamburger (optional)
- Sticky positioning

### React Components (Interactive)

**AuthProvider.tsx** (new)
- React Context for auth state
- Provides: user, loading, logout()
- Wraps entire app

**AuthForm.tsx** (new)
- Login/signup forms
- Email + password inputs
- Form validation (Zod)
- Error messages inline
- Loading state on submit

**SurveyForm.tsx** (new)
- Single-step survey form
- 3 Card sections:
  1. Training goals (distance, km/week, days)
  2. Personal data (age, weight, height, gender)
  3. Personal records (dynamic list, min 1)
- Disclaimer + checkbox
- Real-time validation (Zod + React Hook Form)
- Submit → Loading modal

**TrainingPlanView.tsx** (new)
- Container for 70-day training plan
- Groups days by weeks
- Renders WeekAccordion components
- Auto-scroll to today on mount
- Manages optimistic updates

**WeekAccordion.tsx** (new)
- Accordion item for one week
- Header: "Week X: Y/Z workouts completed"
- Content: List of WorkoutDayCard components
- Collapsible (Shadcn/ui Accordion)

**WorkoutDayCard.tsx** (new)
- Card for single workout day
- Shows: date, day number, description, status
- Checkbox to mark as completed (if not rest day)
- Visual states:
  - Completed: green border + ✓ icon
  - Pending: neutral border + ○ icon
  - Rest: muted background + 🛌 icon, disabled
- Optimistic update on check

**ProfileView.tsx** (new)
- Read-only display of user profile
- 3 Card sections (same as survey)
- Button "Generate New Plan" → /survey
- Fetches data from /api/profile

**EmptyState.tsx** (new)
- Card with message "No active plan"
- CTA button "Generate Plan" → /survey
- Used when user has no plan

**LoadingModal.tsx** (new)
- Modal with spinner
- Progress messages
- Progress bar (indeterminate)
- NOT closable during operation
- Auto-close on success/error
- Timeout after 60 seconds

**ConfirmDialog.tsx** (new)
- Dialog for plan overwrite confirmation
- Message about losing current plan
- Buttons: "Cancel" | "Yes, generate new plan"
- Calls API with confirmation flag

**BottomNav.tsx** (new)
- Mobile bottom navigation bar
- 3 icons: Dashboard, Profile, New Plan
- Active state with accent color
- Hides on scroll down, shows on scroll up

**ErrorBoundary.tsx** (new)
- React Error Boundary component
- Catches unhandled errors
- Fallback UI with "Refresh page" button
- Logs errors to console

---

## Styling Guide

### Tailwind CSS 4
- Utility-first approach
- Custom color palette (oklch color space)
- Responsive utilities (sm:, md:, lg:)
- **NO dark mode in MVP** (only light mode)

### Shadcn/ui (new-york style)
- Button variants: default, destructive, outline, ghost, link
- Card composite: CardHeader, CardTitle, CardContent, CardFooter
- Form components: Input, Select, Radio Group, Checkbox
- Feedback: Dialog, Toast
- Layout: Accordion
- Loading: Skeleton, Progress

### Color Usage
- Primary: Main actions, active states
- Secondary: Less prominent actions
- Muted: Rest days, disabled states
- Destructive: Delete, cancel actions
- Accent: Highlights, completed workouts (green)

### Layout Patterns
- **Cards:** Primary grouping mechanism
- **Stack:** Mobile-first vertical layout
- **Grid:** Desktop optional for wider content
- **Accordion:** Collapsible sections (weeks)

---

## API Integration Patterns

### Server-Side Rendering (Astro)

```typescript
// dashboard.astro
const supabase = Astro.locals.supabase;
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return Astro.redirect('/auth/login');
}

const response = await fetch(`${Astro.url.origin}/api/training-plans/active`, {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
});

const planData = await response.json();
```

### Client-Side Mutations (React)

```typescript
// Optimistic update example
const handleComplete = async (dayId: string) => {
  // Optimistic update
  setWorkoutDays(prev => prev.map(day =>
    day.id === dayId ? { ...day, is_completed: true } : day
  ));

  try {
    await fetch(`/api/workout-days/${dayId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_completed: true })
    });

    toast.success('Workout marked as completed');
  } catch (error) {
    // Rollback on error
    setWorkoutDays(prev => prev.map(day =>
      day.id === dayId ? { ...day, is_completed: false } : day
    ));

    toast.error('Failed to update. Please try again.');
  }
};
```

---

## Unresolved Issues (Optional, Post-MVP)

### 1. Branding & Copywriting
- Exact landing page content (H1, H2, icons)
- Legal disclaimer text (in survey)
- Success messages (toast notifications)
- Congratulations popup after plan completion (US-012)

### 2. Animations & Transitions
- Animations on expand/collapse accordion?
- Transition on smooth scroll to "today"
- Loading modal animations (spinner type)
- Toast slide-in/out animations

### 3. Icons
- Selection of specific icons from lucide-react
- Use emoji (🛌, 🎯, 📊, 🏃) or SVG icons?

### 4. Edge Cases
- What if AI generation timeout (60s) - retry logic?
- What if user closes browser during generation?
- What if plan is 70 days but user starts after a few weeks?

### 5. Analytics (Post-MVP)
- Tracking completion rate (metric from PRD)
- Event tracking (survey submit, plan complete, etc.)
- Error logging (Sentry integration?)

### 6. Internationalization
- Currently Polish only (MVP)
- Structure for future i18n?

### 7. SEO
- Meta tags for pages (title, description)
- OG tags for social sharing
- Sitemap, robots.txt

### 8. Performance
- Lazy loading for 70 workout cards?
- Image optimization (if images added)
- Bundle size monitoring

### Decisions to Confirm Before Implementation
- Final color palette (accent color for active states, completed workouts)
- Exact error message text (only 2 generic vs more details)
- Hamburger menu on mobile or always visible links in navbar?

---

## Summary

This UI architecture plan provides a complete blueprint for implementing the Athletica MVP frontend. The design prioritizes:

1. **Simplicity** - Minimal interface focused on core functionality
2. **User Experience** - Smooth interactions, clear feedback, optimistic updates
3. **Responsiveness** - Mobile-first approach with proper touch targets
4. **Accessibility** - Semantic HTML, keyboard navigation, ARIA labels
5. **Performance** - SSR for initial load, optimistic updates for interactions
6. **Security** - JWT auth, protected routes, input validation

All decisions are based on user feedback through two rounds of questions and align with the PRD requirements and existing backend API architecture.

The implementation plan is divided into 5 phases (21 steps total), prioritizing critical functionality for MVP launch.
