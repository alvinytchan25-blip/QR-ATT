# Phase 4 — Supabase Database Service

## Goal

Replace the SQLite data layer with Supabase queries while keeping the screen
contract unchanged (`registerAttendance`, `getAttendanceHistory`, `createEvent`
behave the same for callers).

## Where the code lives

The lab text uses one file, `lib/database.ts`. This repository was already
refactored through Phases 7–9, so that file is intentionally absent. The same
operations live in focused modules:

| Phase 4 concept | Current location |
|---|---|
| `registerAttendance(payload, studentId)` | `lib/attendance.ts:41` |
| `getAttendanceHistory(studentId)` | `lib/attendance.ts:127` |
| `createEvent(event)` | `lib/events.ts:20` |
| `EventPayload` / QR parsing | `lib/qr.ts` (`QRPayload`, `parseQRPayload`) |
| `AttendanceRecord`, `RegisterResult` | `lib/attendance.ts` |
| `Event` | `lib/events.ts` |
| Teacher attendee list | `getTeacherEventAttendance` in `lib/attendance.ts:148` |

## How each Phase 4 requirement is met

- **Client import** — each module imports `supabase` from `./supabase`.
- **Decode and validate the QR** — `parseQRPayload` returns
  `{ ok: true, payload }` or `{ ok: false, message }`.
- **Time window** — `registerAttendance` converts `start`/`end` with `toTime`
  and rejects scans before the start or after the end.
- **Find the event** — `getEventByCode` uses
  `.select('*').eq('event_code', code).maybeSingle()`.
- **Create the event when missing** — `registerAttendance` inserts it with
  `event_code`, `title`, `start_time`, `end_time`. RLS blocks this for
  non-teachers, which returns a friendly message instead of a crash.
- **Insert attendance** — `.from('attendance').insert([{ student_id, event_id }])`.
- **Duplicate guard** — `attError.code === '23505'` becomes
  “Already registered for this event.”
- **History join** — `.select('id, scanned_at, events ( event_code, title )')`
  then `.map()` renames `scanned_at` to `scannedAt`.
- **Create event** — `.upsert(..., { onConflict: 'event_code' })` with
  `created_by` from `supabase.auth.getUser()`.
- **Cloud-only** — no `expo-sqlite` import remains in the data layer.

## Intentional differences from the lab text

1. **Split modules instead of one file.** This is the Phase 9 end state; Phase 9
   explicitly deletes `lib/database.ts`.
2. **`createEvent` returns `{ error }`** instead of `void`, so the Teacher screen
   can display failures such as “Only teacher accounts can create events.”
3. **`registerAttendance` also maps `42501`** to “Attendance is not open for
   this event right now,” covering the RLS window check.
4. **Event inserts are teacher-only** and attendance inserts are window-checked
   (the Phase 10/security enhancements).
5. **Non-UUID student ids are rejected up front** with “You must be signed in.”

## Verification

- `npm run typecheck` passes.
- Manual flow:
  1. Teacher creates an event (set a profile's `role` to `teacher` in Table
     Editor first).
  2. A different student scans the QR.
  3. History shows the event.
  4. A second scan shows “Already registered for this event.”
  5. The row appears in Supabase → Table Editor → `attendance`.
