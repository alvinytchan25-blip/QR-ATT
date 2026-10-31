# Phase 9 — QR Attendance (Cloud Events)

## Goal

Put every attendance operation in `lib/attendance.ts`, make the scanner resolve
events through the shared `getEventByCode` helper, and keep the legacy
`lib/database.ts` deleted.

## Where attendance lives

| Function | Location |
|---|---|
| `registerAttendance` | `lib/attendance.ts` |
| `getAttendanceHistory` | `lib/attendance.ts` |
| `getTeacherEventAttendance` | `lib/attendance.ts` |
| `getTeacherEventSummary` | `lib/attendance.ts` |
| `AttendanceRecord`, `RegisterResult`, `TeacherEventAttendance`, `TeacherEventSummary` | `lib/attendance.ts` |

`lib/database.ts` does not exist. Phases 7–9 split it into
`lib/events.ts`, `lib/qr.ts`, and `lib/attendance.ts`.

Screens import the split module:

```ts
import { registerAttendance } from '@/lib/attendance';   // scan.tsx
import { getAttendanceHistory, type AttendanceRecord } from '@/lib/attendance'; // history.tsx
```

## Scan flow

1. `parseQRPayload(raw)` validates the `v:1` format (Phase 8).
2. The time window rejects scans before `start` or after `end`.
3. `getEventByCode(payload.event)` looks up the cloud event (Phase 7).
4. If no event exists, `registerAttendance` tries to insert one. The Phase 3
   RLS policy restricts event inserts to teachers, so for a student this
   returns “This event has not been set up by a teacher yet.” The normal flow
   is that the teacher created the event first.
5. The attendance row is inserted with `student_id` + `event_id`.
6. `23505` → “Already registered for this event.”
7. `42501` → “Attendance is not open for this event right now.”

## Reused lookup

The scanner no longer hand-writes the event query:

```ts
const foundEvent = await getEventByCode(payload.event);
```

The query lives once in `lib/events.ts` and is also used by future features.

## Intentional differences from the lab text

1. **`getEventByCode` returns the full `CloudEvent`**, which `registerAttendance`
   uses directly; the local `event` only needs `id` and `title`.
2. **The missing-event fallback is RLS-aware.** It still attempts the insert,
   but the teacher-only policy means students see a clear message instead of a
   generic “Could not create event.”
3. **`42501` is mapped** to the time-window/RLS message.
4. **Non-UUID student ids are rejected up front** with “You must be signed in.”
5. **`lib/database.ts` stays absent** because the repo is at the Phase 9 split.

## Verification

1. `npm run typecheck` — no errors, no `lib/database` imports.
2. Student scans a teacher QR → “Attendance recorded!”
3. Second scan → “Already registered for this event.”
4. An ended event → “Event has already ended.”
5. Supabase `attendance` has the `student_id` + `event_id` row.
6. The teacher’s attendee count and the student’s history both reflect the scan.
