# Phase 10 — History & Teacher Summary

## Goal

Finalize the attendance read queries and make the teacher summary efficient: it
should count attendance without downloading the attendee rows.

## The two patterns

| Pattern | Function | Use |
|---|---|---|
| Full detail | `getTeacherEventAttendance` | Render the actual attendees (names/ids) |
| Count only | `getTeacherEventSummary` | Show only attendee counts |

`getAttendanceHistory` stays a single joined query for the student view.

## Efficient summary

Before, `getTeacherEventSummary` called `getTeacherEventAttendance` and threw
away the attendee lists. It now:

1. Queries the teacher's events with only `id, event_code, title`.
2. Returns `[]` when there are no events.
3. Fetches only the `event_id` column from `attendance` for those events.
4. Increments a `counts` dictionary per event.
5. Maps each event to `{ eventId, eventCode, title, attendeeCount }`, using
   `counts[e.id] ?? 0`.

If the attendance query fails, it returns the events with `attendeeCount: 0`
rather than throwing.

The lab's pseudocode assigns the whole Supabase response to `events`; the
implementation destructures `{ data, error }` correctly.

## History screen

`app/(tabs)/history.tsx` still uses `getTeacherEventAttendance` because the
teacher view renders the full attendee list. `getTeacherEventSummary` is the
lighter option for count-only views (badges, dashboards).

## Attendee names

The bonus enhancement is already applied:

- `supabase/schema.sql` has “Teachers can view profiles of their attendees”.
- `getTeacherEventAttendance` selects
  `profiles ( full_name, email )` through
  `attendance.student_id → profiles(id)`.
- The History screen renders `studentName`, falling back to `shortId`.

**Re-run `supabase/schema.sql` in the Supabase SQL Editor** so the policy exists
in the cloud project; otherwise the teacher view cannot read other users'
profiles.

## Verification

1. `npm run typecheck` — no errors.
2. Student History shows scans with event titles, newest first.
3. Teacher History shows events with correct counts and the full attendee list.
4. Events with no scans show `0`, not `undefined`.
5. Supabase `attendance` row counts match the UI badges.
