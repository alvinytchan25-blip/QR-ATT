# Phase 7 — Events Service

> The design pass is `07-visual-identity.md`; this migration phase is numbered
> 08 to avoid the clash. It is Supabase migration Phase 7.

## Goal

Give events their own service module, keep attendance code separate, and ensure
only Teacher accounts can use the Teacher tab.

## `lib/events.ts`

| Export | Purpose |
|---|---|
| `Event` | App-facing shape (`eventId`, `title`, `start`, `end`) |
| `CloudEvent` | Database row shape (`event_code`, `start_time`, `end_time`, `created_by`, ...) |
| `createEvent(event)` | Upsert by `event_code`, with `created_by` set from the session |
| `getEventsByTeacher(teacherId)` | The teacher's events, newest first, `[]` on error |
| `getEventByCode(code)` | One event by public code, `null` when missing |

`createEvent` translates the app shape to the database columns
(`start → start_time`, `end → end_time`) and returns a small `{ error }` result.

## `lib/database.ts`

The file does not exist in this repo. It was already split in the later phases:

- attendance operations → `lib/attendance.ts`
- event operations → `lib/events.ts`
- QR payload parsing → `lib/qr.ts`

So the “remove `createEvent` from `lib/database.ts`” step is already satisfied,
and the Teacher screen imports from `@/lib/events`.

## Attendance reuses the events service

`getTeacherEventAttendance` (the Phase 6 teacher view) now calls
`getEventsByTeacher(teacherId)` instead of duplicating the events query, then
fetches attendance for those event ids and groups it per event.

## Teacher role gate

`app/(tabs)/teacher.tsx` already implements the gate:

1. `useFocusEffect` calls `getProfile(user.id)` each time the tab is shown.
2. `role` defaults to `student` when the profile is missing.
3. While loading, it shows “Checking your account...”.
4. If `role !== 'teacher'`, it shows the “Teachers Only” lock screen.

This is the app-side half of access control; the Phase 3 RLS insert policy is the
database-side half.

## Intentional differences from the lab text

1. **`createEvent` returns friendly errors** for `42501` (“Only teacher accounts
   can create events”) and `23505` (“Event code is already in use”).
2. **`getEventByCode` selects `*`** and returns the full `CloudEvent`, which is
   what `registerAttendance` needs.
3. **No `lib/database.ts`** because the repo is at the Phase 9 split.

## Testing

1. `npm run typecheck` — no errors.
2. Student → Teacher tab → “Teachers Only”.
3. Teacher → Teacher tab → form; create an event and see the QR.
4. Supabase `events` row has `created_by` set to the teacher id.
5. Student → Scan/History/Profile still work.
6. Teacher’s History counts the event.
