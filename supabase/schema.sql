-- ============================================================
-- Supabase PostgreSQL Schema for QR-ATT
--
-- HOW TO RUN:
--   1. Open Supabase Dashboard -> SQL Editor
--   2. Paste the ENTIRE file
--   3. Click "Run"
--   4. Verify the tables appear under Table Editor
--
-- This script is IDEMPOTENT: it can be run multiple times safely.
-- It also repairs databases created by earlier versions of this
-- file (see the migrations in section 3 and 4).
--
-- DO NOT REMOVE THE GRANT STATEMENTS. Since 30 May 2026 Supabase stopped
-- exposing new public tables to the Data API by default, so the GRANTs are
-- what make these tables visible to the app at all. They are NOT redundant
-- with Row Level Security: grants decide whether a role can touch a table,
-- RLS decides which rows it can see. Removing the grants makes every query
-- fail with "permission denied for table ..." (code 42501).
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILES TABLE
-- Stored per-user profile that references Supabase Auth.
-- Created automatically for each new signed-up user.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'student' check (role in ('student', 'teacher')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Grants are a layer BELOW Row Level Security. Since 30 May 2026 Supabase no
-- longer auto-exposes new tables in the public schema to the Data API, so
-- without these every request is rejected by Postgres before RLS is even
-- consulted ("permission denied for table profiles", code 42501).
--
-- `update` is required as well as `insert`: supabase-js `.upsert()` compiles
-- to INSERT ... ON CONFLICT DO UPDATE, which saves profiles and events.
-- Only `authenticated` is granted -- every query in the app runs after sign-in.
grant select, insert, update on public.profiles to authenticated;

-- ------------------------------------------------------------
-- 2. EVENTS TABLE
-- Represents an attendance event.
-- `event_code` is the public identifier embedded in the QR code.
-- ------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  event_code text not null unique,
  title text not null,
  start_time timestamptz,
  end_time timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

-- No DELETE grant: the app never deletes rows, and the
-- "Users can delete their own events" policy below stays unreachable until
-- someone deliberately adds that grant. The policy is kept so RLS is already
-- correct if a delete feature is added later.
grant select, insert, update on public.events to authenticated;

-- ------------------------------------------------------------
-- 3. ATTENDANCE TABLE
-- Records one student scanning one event.
-- `student_id` references public.profiles (NOT auth.users).
-- ------------------------------------------------------------
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  scanned_at timestamptz not null default now(),
  unique (student_id, event_id)
);

alter table public.attendance enable row level security;

-- Read: own records (student) and rosters for their own events (teacher).
-- Write: insert only, and RLS below also enforces the event time window.
grant select, insert on public.attendance to authenticated;

-- Safety net: every primary key today is gen_random_uuid(), so no sequences
-- exist yet. A later phase adding a serial column would otherwise hit a
-- confusing "permission denied for sequence" error.
grant usage, select on all sequences in schema public to authenticated;

-- MIGRATION (safe to run on a database created by an older schema):
-- `student_id` used to reference auth.users directly. PostgREST can only embed
-- a related table along a *direct* foreign key, so `attendance -> profiles`
-- was invisible and the teacher's attendee list always came back empty.
-- Profiles cascade from auth.users, so deleting the auth user still cascades.
do $$
declare
  old_fk text;
begin
  select conname into old_fk
  from pg_constraint
  where conrelid = 'public.attendance'::regclass
    and contype = 'f'
    and pg_get_constraintdef(oid) ilike '%auth.users%';

  if old_fk is not null then
    execute format('alter table public.attendance drop constraint %I', old_fk);
    execute 'alter table public.attendance
             add constraint attendance_student_id_fkey
             foreign key (student_id) references public.profiles (id) on delete cascade';
  end if;
end
$$;

-- MIGRATION: make sure the uniqueness constraint exists even on old tables.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.attendance'::regclass and contype = 'u'
  ) then
    execute 'alter table public.attendance
             add constraint attendance_student_id_event_id_key
             unique (student_id, event_id)';
  end if;
end
$$;

-- Indexes that support the hot read paths (teacher dashboard, student history).
create index if not exists events_created_by_idx on public.events (created_by);
create index if not exists attendance_event_id_idx on public.attendance (event_id);
create index if not exists attendance_student_id_idx on public.attendance (student_id);
create index if not exists attendance_scanned_at_idx on public.attendance (scanned_at desc);

-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY POLICIES
-- All tables must exist BEFORE any policy that references them,
-- otherwise CREATE POLICY fails because PostgreSQL resolves the
-- referenced relations at creation time.
-- ------------------------------------------------------------

-- Profiles policies
drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Teachers can read the profiles of students who attended their events
-- (needed to show attendee names in the teacher's History view).
drop policy if exists "Teachers can view profiles of their attendees" on public.profiles;
create policy "Teachers can view profiles of their attendees"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.attendance a
      join public.events e on e.id = a.event_id
      where a.student_id = profiles.id
        and e.created_by = auth.uid()
    )
  );

-- Events policies
-- Any signed-in user can read event details (needed to validate QR codes)
drop policy if exists "Events are readable by any authenticated user" on public.events;
create policy "Events are readable by any authenticated user"
  on public.events for select
  using (auth.role() = 'authenticated');

-- Only teachers may create events, and only under their own id.
drop policy if exists "Users can insert events" on public.events;
drop policy if exists "Teachers can insert their own events" on public.events;
create policy "Teachers can insert their own events"
  on public.events for insert
  with check (
    auth.role() = 'authenticated'
    and auth.uid() = created_by
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher'
    )
  );

drop policy if exists "Users can update their own events" on public.events;
create policy "Users can update their own events"
  on public.events for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

drop policy if exists "Users can delete their own events" on public.events;
create policy "Users can delete their own events"
  on public.events for delete
  using (auth.uid() = created_by);

-- Attendance policies
-- Students can only view / insert their own attendance
drop policy if exists "Students can view their own attendance" on public.attendance;
create policy "Students can view their own attendance"
  on public.attendance for select
  using (auth.uid() = student_id);

-- The window check means the app's own start/end validation cannot be bypassed
-- by calling the REST API directly. A 5 minute grace absorbs device clock skew.
drop policy if exists "Students can insert their own attendance" on public.attendance;
create policy "Students can insert their own attendance"
  on public.attendance for insert
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.events e
      where e.id = attendance.event_id
        and (e.start_time is null or e.start_time <= now() + interval '5 minutes')
        and (e.end_time is null or e.end_time >= now() - interval '5 minutes')
    )
  );

-- Teachers can view attendance for events they created
drop policy if exists "Teachers can view attendance for their events" on public.attendance;
create policy "Teachers can view attendance for their events"
  on public.attendance for select
  using (
    exists (
      select 1 from public.events e
      where e.id = attendance.event_id
        and e.created_by = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 5. TRIGGERS: keep updated_at fresh, auto-create profile on signup
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Creates the profile row on signup. `full_name` and `role` are read from the
-- user_metadata the app sends to auth.signUp, so they survive even when the
-- project requires email confirmation (no session exists at that point).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    case
      when new.raw_user_meta_data ->> 'role' = 'teacher' then 'teacher'
      else 'student'
    end
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        role = excluded.role;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- END OF SCHEMA
-- ============================================================

-- ============================================================
-- OPTIONAL VERIFICATION (commented out, so it never runs with
-- the schema). Paste it into the SQL Editor AFTER running the
-- schema above, on its own, to confirm everything landed.
-- ============================================================
--
-- -- 1. All three tables exist
-- select tablename from pg_tables
--  where schemaname = 'public'
--    and tablename in ('profiles', 'events', 'attendance')
--  order by tablename;
-- -- Expect 3 rows: attendance, events, profiles
--
-- -- 2. Row Level Security is ON for every table
-- select relname as table, relrowsecurity as rls_enabled
--  from pg_class
--  where relname in ('profiles', 'events', 'attendance')
--    and relkind = 'r'
--  order by relname;
-- -- Expect rls_enabled = true on all three
--
-- -- 3. The GRANTs exist. THIS is the one that usually fails.
-- select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
--  from information_schema.role_table_grants
--  where table_schema = 'public'
--    and grantee = 'authenticated'
--    and table_name in ('profiles', 'events', 'attendance')
--  group by table_name, grantee
--  order by table_name;
-- -- Expect:
-- --   attendance | INSERT, SELECT
-- --   events     | INSERT, SELECT, UPDATE
-- --   profiles   | INSERT, SELECT, UPDATE
-- -- If a table is missing from this result, the Data API cannot see it
-- -- and the app will report "permission denied for table <name>".
--
-- -- 4. Both triggers are installed
-- select tgname as trigger, tgrelid::regclass as on_table
--  from pg_trigger
--  where not tgisinternal
--  order by tgname;
-- -- Expect: on_auth_user_created (auth.users) and profiles_set_updated_at
--
-- -- 5. Policies per table
-- select tablename, policyname, cmd
--  from pg_policies
--  where schemaname = 'public'
--  order by tablename, policyname;
-- -- Expect 11 policies across the three tables
-- ============================================================
