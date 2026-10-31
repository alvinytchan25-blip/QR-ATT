# Phase 6 — Attendance by Role (Teacher View)

## Goal

Make the History tab role-aware:

- **Student** — own attendance history (Phase 4 behavior).
- **Teacher** — the events they created, with attendee counts and the students who
  scanned.

## Files

| File | Role |
|---|---|
| `lib/attendance.ts` | `getTeacherEventAttendance` (events + attendance) and `getTeacherEventSummary` |
| `app/(tabs)/history.tsx` | Reads the profile role and renders the student or teacher view |
| `supabase/schema.sql` | RLS policy “Teachers can view attendance for their events” |

## How it works

`getTeacherEventAttendance` uses two queries:

1. `events` filtered by `.eq('created_by', teacherId)`, newest first.
2. `attendance` filtered by `.in('event_id', eventIds)`, newest first.

It then groups the attendance rows per event in JavaScript, so the screen gets
one object per event with `attendeeCount` and `attendees`.

`app/(tabs)/history.tsx` loads `getProfile(user.id)` on focus, defaults to
`student` when the profile is missing, and calls:

- `getTeacherEventAttendance(user.id)` for teachers.
- `getAttendanceHistory(user.id)` for students.

## RLS that powers the teacher view

```sql
create policy "Teachers can view attendance for their events"
  on public.attendance for select
  using (
    exists (
      select 1 from public.events e
      where e.id = attendance.event_id
        and e.created_by = auth.uid()
    )
  );
```

The events query is also scoped to `created_by`, so a teacher cannot see another
teacher's events even though authenticated users can read events.

## Student names (Phase 10 follow-up already applied)

The lab notes that Phase 6 originally showed student ids only, because profiles
are owner-only under RLS. This repo already includes the follow-up:

- `supabase/schema.sql` adds “Teachers can view profiles of their attendees”.
- `getTeacherEventAttendance` selects
  `profiles ( full_name, email )` through the
  `attendance.student_id → profiles(id)` foreign key.
- The History screen shows `studentName` and falls back to `shortId(...)`.

## `getTeacherEventSummary`

A small convenience wrapper that maps the full result down to
`{ eventId, eventCode, title, attendeeCount }`. The History screen uses the full
`getTeacherEventAttendance` because it also renders the attendee list.

## Testing

1. `npm run typecheck` — no errors.
2. Create events as a **Teacher** (same account that will view History).
3. Scan them as a **Student**.
4. Teacher → History: event cards with counts and attendee names.
5. Student → History: only their own scans.
6. Teacher with no events: empty-state message.
7. A teacher cannot see another teacher's events (RLS).

## Common issues

- **Teacher sees no events:** the events were created by a different account, so
  `created_by` does not match.
- **Attendance is empty:** `events.created_by` is null (event created while not
  signed in) or the student never scanned.
- **Student view is empty:** no scans yet, or `profiles.role` is wrong.
