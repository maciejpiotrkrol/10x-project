-- ============================================================================
-- migration: create_initial_schema
-- date: 2025-11-08
-- author: athletica mvp database schema
-- description: initial database schema for athletica running training app
--
-- this migration creates the complete database structure for the mvp including:
-- - custom enum types (gender_type, distance_type)
-- - core tables (profiles, personal_records, training_plans, workout_days)
-- - performance indexes
-- - row level security policies
-- - automated triggers for updated_at columns
--
-- affected tables: profiles, personal_records, training_plans, workout_days
-- dependencies: requires supabase auth.users table
-- notes: all tables have rls enabled with granular policies per operation
-- ============================================================================

-- ============================================================================
-- section 1: custom enum types
-- ============================================================================

-- create gender_type enum for user gender classification
-- used in profiles table to store user's biological gender
-- values: 'M' (male), 'F' (female)
create type gender_type as enum ('M', 'F');

-- create distance_type enum for race distances
-- used in both profiles.goal_distance and personal_records.distance
-- supports the four most common running race distances
-- values: '5K', '10K', 'Half Marathon', 'Marathon'
create type distance_type as enum ('5K', '10K', 'Half Marathon', 'Marathon');

-- ============================================================================
-- section 2: core tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- table: profiles
-- ----------------------------------------------------------------------------
-- stores user survey data with 1:1 relationship to auth.users
-- data is overwritten on each new survey submission (no history in mvp)
-- contains physical characteristics and training preferences
create table profiles (
  -- primary key: references supabase auth.users
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- training goal: target race distance
  goal_distance distance_type not null,

  -- current training volume: average weekly kilometers
  weekly_km decimal(6,2) not null,

  -- training frequency: number of training days per week (2-7 days)
  training_days_per_week integer not null check (training_days_per_week between 2 and 7),

  -- user physical characteristics
  age integer not null check (age > 0 and age < 120),
  weight decimal(5,2) not null check (weight > 0 and weight < 300),  -- in kg
  height integer not null check (height > 0 and height < 300),       -- in cm
  gender gender_type not null,

  -- audit timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add comment explaining profile data handling
comment on table profiles is 'User profile data from survey. Data is overwritten on each survey submission without history tracking in MVP.';

-- ----------------------------------------------------------------------------
-- table: personal_records
-- ----------------------------------------------------------------------------
-- stores user's personal best times for different race distances
-- 1:n relationship with auth.users (one user can have multiple records)
-- no achieved_at column in mvp - simple record tracking without history
create table personal_records (
  -- primary key: unique identifier for each record
  id uuid primary key default gen_random_uuid(),

  -- foreign key: references the user who owns this record
  user_id uuid not null references auth.users(id) on delete cascade,

  -- race distance for this personal record
  distance distance_type not null,

  -- personal best time in seconds (must be positive)
  time_seconds integer not null check (time_seconds > 0),

  -- audit timestamp: when the record was added to the system
  created_at timestamptz not null default now()
);

-- add comment explaining personal records purpose
comment on table personal_records is 'User personal best times for different race distances. Multiple records per user allowed (one per distance).';

-- ----------------------------------------------------------------------------
-- table: training_plans
-- ----------------------------------------------------------------------------
-- stores training plans for users with soft-delete pattern
-- 1:n relationship with auth.users, but only one plan can be active at a time
-- old plans marked as inactive (is_active = false) instead of physical deletion
-- prepares for future "plan history" feature while keeping mvp simple
create table training_plans (
  -- primary key: unique identifier for each training plan
  id uuid primary key default gen_random_uuid(),

  -- foreign key: references the user who owns this plan
  user_id uuid not null references auth.users(id) on delete cascade,

  -- plan duration: start and end dates (70 days total)
  start_date date not null,
  end_date date not null,

  -- generation timestamp: when the ai created this plan
  generated_at timestamptz not null default now(),

  -- activation status: true = current active plan, false = historical plan
  -- only one active plan per user enforced by unique constraint below
  is_active boolean not null default true,

  -- flexible metadata field for future extensions without schema changes
  metadata jsonb null,

  -- audit timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add comment explaining soft-delete pattern
comment on table training_plans is 'Training plans with soft-delete pattern. Only one active plan per user. Old plans marked as inactive for future history feature.';
comment on column training_plans.is_active is 'Activation flag: true = current active plan, false = historical plan. Only one active plan allowed per user.';
comment on column training_plans.metadata is 'JSONB field for future extensions (e.g., ai model version, generation parameters) without schema migrations.';

-- ----------------------------------------------------------------------------
-- table: workout_days
-- ----------------------------------------------------------------------------
-- stores individual workout days within a training plan
-- 1:70 relationship with training_plans (each plan has exactly 70 days)
-- granular structure (one record per day) simplifies querying, filtering, and updates
-- rest days explicitly marked and cannot be marked as completed
create table workout_days (
  -- primary key: unique identifier for each workout day
  id uuid primary key default gen_random_uuid(),

  -- foreign key: references the parent training plan
  training_plan_id uuid not null references training_plans(id) on delete cascade,

  -- sequential day number within the plan (1-70)
  day_number integer not null check (day_number between 1 and 70),

  -- calendar date for this workout day
  date date not null,

  -- full workout description generated by ai (formatted text)
  -- text type provides flexibility for ai to generate rich formatted content
  workout_description text not null,

  -- rest day flag: true = rest day (no workout), false = training day
  is_rest_day boolean not null default false,

  -- completion tracking: whether user marked this workout as completed
  is_completed boolean not null default false,

  -- completion timestamp: when user marked workout as completed (null if not completed)
  completed_at timestamptz null,

  -- unique constraint: ensures one record per day number per plan
  constraint unique_day_per_plan unique (training_plan_id, day_number),

  -- business rule: rest days cannot be marked as completed
  -- prevents users from checking off rest days in the ui
  constraint no_completed_rest_days check (not (is_rest_day = true and is_completed = true))
);

-- add comments explaining workout_days behavior
comment on table workout_days is 'Individual workout days within training plans. Granular structure (70 records per plan) enables efficient querying and status updates.';
comment on column workout_days.workout_description is 'AI-generated workout description. TEXT type allows flexible formatting for rich content.';
comment on constraint no_completed_rest_days on workout_days is 'Business rule: prevents marking rest days as completed. Rest days are for recovery and should not be checked off.';

-- ============================================================================
-- section 3: performance indexes
-- ============================================================================

-- index for efficient lookup of user's personal records
-- optimizes query: select * from personal_records where user_id = $1
create index idx_personal_records_user_id on personal_records(user_id);

-- partial unique index for active training plans
-- enforces business rule: only one active plan per user
-- optimizes query: select * from training_plans where user_id = $1 and is_active = true
-- partial index only indexes rows where is_active = true, reducing index size
create unique index idx_training_plans_user_active on training_plans(user_id) where is_active = true;

-- index for efficient lookup of workout days by training plan
-- optimizes query: select * from workout_days where training_plan_id = $1
create index idx_workout_days_plan_id on workout_days(training_plan_id);

-- index for filtering and sorting workout days by date
-- enables efficient date-based queries and chronological ordering
create index idx_workout_days_date on workout_days(date);

-- ============================================================================
-- section 4: row level security (rls) policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- rls for profiles table
-- ----------------------------------------------------------------------------
-- security model: authenticated users can manage their own profile
-- anonymous users have no access to profiles
alter table profiles enable row level security;

-- select policy: authenticated users can view their own profile
create policy "Users can view own profile"
on profiles for select
to authenticated
using (user_id = auth.uid());

-- insert policy: authenticated users can create their own profile
create policy "Users can insert own profile"
on profiles for insert
to authenticated
with check (user_id = auth.uid());

-- update policy: authenticated users can update their own profile
-- using clause checks existing row ownership, with check validates new data
create policy "Users can update own profile"
on profiles for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- delete policy: authenticated users can delete their own profile
create policy "Users can delete own profile"
on profiles for delete
to authenticated
using (user_id = auth.uid());

-- deny all access to anonymous users
-- explicit denial policy for security clarity
create policy "Anon users have no access to profiles"
on profiles for all
to anon
using (false);

-- ----------------------------------------------------------------------------
-- rls for personal_records table
-- ----------------------------------------------------------------------------
-- security model: authenticated users can manage their own personal records
-- anonymous users have no access to personal records
alter table personal_records enable row level security;

-- select policy: authenticated users can view their own personal records
create policy "Users can view own personal records"
on personal_records for select
to authenticated
using (user_id = auth.uid());

-- insert policy: authenticated users can create their own personal records
create policy "Users can insert own personal records"
on personal_records for insert
to authenticated
with check (user_id = auth.uid());

-- update policy: authenticated users can update their own personal records
-- using clause checks existing row ownership, with check validates new data
create policy "Users can update own personal records"
on personal_records for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- delete policy: authenticated users can delete their own personal records
create policy "Users can delete own personal records"
on personal_records for delete
to authenticated
using (user_id = auth.uid());

-- deny all access to anonymous users
-- explicit denial policy for security clarity
create policy "Anon users have no access to personal records"
on personal_records for all
to anon
using (false);

-- ----------------------------------------------------------------------------
-- rls for training_plans table
-- ----------------------------------------------------------------------------
-- security model: authenticated users can manage their own training plans
-- anonymous users have no access to training plans
alter table training_plans enable row level security;

-- select policy: authenticated users can view their own training plans
-- includes both active and historical plans
create policy "Users can view own training plans"
on training_plans for select
to authenticated
using (user_id = auth.uid());

-- insert policy: authenticated users can create their own training plans
create policy "Users can insert own training plans"
on training_plans for insert
to authenticated
with check (user_id = auth.uid());

-- update policy: authenticated users can update their own training plans
-- allows marking plans as inactive and updating metadata
-- using clause checks existing row ownership, with check validates new data
create policy "Users can update own training plans"
on training_plans for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- delete policy: authenticated users can delete their own training plans
-- note: in mvp, soft-delete (is_active = false) is preferred over physical deletion
create policy "Users can delete own training plans"
on training_plans for delete
to authenticated
using (user_id = auth.uid());

-- deny all access to anonymous users
-- explicit denial policy for security clarity
create policy "Anon users have no access to training plans"
on training_plans for all
to anon
using (false);

-- ----------------------------------------------------------------------------
-- rls for workout_days table
-- ----------------------------------------------------------------------------
-- security model: authenticated users can manage workout days in their own training plans
-- ownership verified via join with training_plans table (no direct user_id in workout_days)
-- anonymous users have no access to workout days
alter table workout_days enable row level security;

-- select policy: authenticated users can view workout days from their own training plans
-- uses exists subquery to verify plan ownership via training_plans.user_id
create policy "Users can view own workout days"
on workout_days for select
to authenticated
using (
  exists (
    select 1 from training_plans
    where training_plans.id = workout_days.training_plan_id
    and training_plans.user_id = auth.uid()
  )
);

-- insert policy: authenticated users can create workout days in their own training plans
-- uses exists subquery to verify plan ownership via training_plans.user_id
create policy "Users can insert own workout days"
on workout_days for insert
to authenticated
with check (
  exists (
    select 1 from training_plans
    where training_plans.id = workout_days.training_plan_id
    and training_plans.user_id = auth.uid()
  )
);

-- update policy: authenticated users can update workout days in their own training plans
-- primary use case: marking workouts as completed/uncompleted
-- using clause checks existing row ownership, with check validates new data
-- both clauses use exists subquery to verify plan ownership
create policy "Users can update own workout days"
on workout_days for update
to authenticated
using (
  exists (
    select 1 from training_plans
    where training_plans.id = workout_days.training_plan_id
    and training_plans.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from training_plans
    where training_plans.id = workout_days.training_plan_id
    and training_plans.user_id = auth.uid()
  )
);

-- delete policy: authenticated users can delete workout days from their own training plans
-- uses exists subquery to verify plan ownership via training_plans.user_id
create policy "Users can delete own workout days"
on workout_days for delete
to authenticated
using (
  exists (
    select 1 from training_plans
    where training_plans.id = workout_days.training_plan_id
    and training_plans.user_id = auth.uid()
  )
);

-- deny all access to anonymous users
-- explicit denial policy for security clarity
create policy "Anon users have no access to workout days"
on workout_days for all
to anon
using (false);

-- ============================================================================
-- section 5: automated triggers
-- ============================================================================

-- ----------------------------------------------------------------------------
-- function: update_updated_at_column
-- ----------------------------------------------------------------------------
-- purpose: automatically updates updated_at timestamp on row updates
-- used by triggers on tables with updated_at columns (profiles, training_plans)
-- ensures updated_at always reflects the last modification time
create or replace function update_updated_at_column()
returns trigger as $$
begin
  -- set updated_at to current timestamp for the updated row
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- add comment explaining function purpose
comment on function update_updated_at_column() is 'Trigger function that automatically updates updated_at column to current timestamp on row updates.';

-- ----------------------------------------------------------------------------
-- trigger: update_profiles_updated_at
-- ----------------------------------------------------------------------------
-- purpose: automatically update updated_at timestamp when profile is modified
-- fires before update operation to ensure timestamp is set before row commit
create trigger update_profiles_updated_at
before update on profiles
for each row
execute function update_updated_at_column();

-- ----------------------------------------------------------------------------
-- trigger: update_training_plans_updated_at
-- ----------------------------------------------------------------------------
-- purpose: automatically update updated_at timestamp when training plan is modified
-- fires before update operation to ensure timestamp is set before row commit
create trigger update_training_plans_updated_at
before update on training_plans
for each row
execute function update_updated_at_column();

-- ============================================================================
-- migration complete
-- ============================================================================
-- this migration has successfully created the initial database schema for
-- athletica mvp including all tables, indexes, rls policies, and triggers.
-- the schema supports the core mvp features:
-- - user profiles with survey data
-- - personal records tracking
-- - ai-generated 10-week training plans
-- - workout completion tracking
-- - full row level security for data protection
-- ============================================================================
