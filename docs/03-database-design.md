# Phase 3 — Database Design

## Goal

Create a secure cloud database with three related tables in Supabase:
`profiles`, `events`, and `attendance`.

The full, idempotent SQL lives in [`supabase/schema.sql`](../supabase/schema.sql).

## Tables

### `profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key; references `auth.users(id)` (`on delete cascade`) |
| `email` | `text` | Not null |
| `full_name` | `text` | Optional display name |
| `role` | `text` | `student` or `teacher`, defaults to `student` |
| `created_at` | `timestamptz` | Defaults to `now()` |
| `updated_at` | `timestamptz` | Refreshed by a trigger |

### `events`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, `gen_random_uuid()` |
| `event_code` | `text` | Not null, unique; embedded in the QR code |
| `title` | `text` | Not null |
| `start_time` / `end_time` | `timestamptz` | Named `_time` because `end` is a reserved word |
| `created_by` | `uuid` | References `auth.users(id)` (`on delete set null`) |
| `created_at` | `timestamptz` | Defaults to `now()` |

### `attendance`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, `gen_random_uuid()` |
| `student_id` | `uuid` | Not null; references `profiles(id)` (`on delete cascade`) |
| `event_id` | `uuid` | Not null; references `events(id)` (`on delete cascade`) |
| `scanned_at` | `timestamptz` | Defaults to `now()` |
| — | — | `unique (student_id, event_id)` blocks duplicate scans |

## Relationships

- `profiles.id → auth.users.id` — one user has one profile (1:1).
- `events.created_by → auth.users.id` — one teacher creates many events.
- `attendance.student_id → profiles.id` — one student has many attendance rows.
- `attendance.event_id → events.id` — one event has many attendance rows.

## Row Level Security

RLS is enabled on all three tables. Policies cover:

- Profiles: view/insert/update your own; teachers can read attendees' names.
- Events: any authenticated user can read; teachers create; owners update/delete.
- Attendance: students read/insert their own; teachers read their events' rows.
- Inserts are also constrained by the event time window.

The schema includes explicit `GRANT` statements because newer Supabase projects
no longer expose new `public` tables to the Data API automatically.

## Trigger

`handle_new_user()` runs after a row is inserted into `auth.users` and creates
the matching `profiles` row automatically. It reads `full_name` and `role` from
signup metadata when present.

## Intentional Differences From the Lab Text

1. **`attendance.student_id` references `profiles(id)`, not `auth.users(id)`.**
   The id is still the same 1:1 user id, but this direct key lets PostgREST embed
   student names for the teacher's attendee list. The schema's migration block
   upgrades older databases automatically.
2. **Event creation is teacher-only**, and attendance insertion checks the event
   window. These are the later Phase 10/security enhancements already applied.
3. **Grants are included.** Without them the app gets
   `permission denied for table ...` (code `42501`).

## How to Run

1. Supabase Dashboard → **SQL Editor** → **New query**.
2. Paste the entire contents of `supabase/schema.sql`.
3. Click **Run**. Expect “Success. No rows returned.”
4. Open **Table Editor** and confirm `profiles`, `events`, and `attendance`.
5. Confirm RLS is enabled on all three tables.

The commented verification queries at the end of `schema.sql` can be run on their
own to check tables, RLS, grants, triggers, and policies.
