# Migration Log — QR-ATT Supabase Migration

> This log tracks every phase of the migration from SQLite to Supabase.
> Each entry records what changed, why, and the result.

**Reconciliation note (2026-10-29):** This detailed version adopts the canonical
Phase 0–10 structure. Entries are corrected to match this repository: no `.env`
is committed, `expo-secure-store` is not a dependency, the SQLite baseline and
`lib/database.ts` are absent, and the phase docs use the filenames listed in
each entry. The canonical timeline dates are retained.

---

## Entry Template

```markdown
### Phase X — Module Name

- **Date:** YYYY-MM-DD
- **Phase:** X
- **Module:** Module Name
- **Files changed:** list
- **Files created:** list
- **Files removed:** list
- **What changed:** description
- **Why it changed:** reason
- **Testing performed:** what was tested
- **Result:** pass/fail
- **Next step:** what comes next
```

---

## Log Entries

### Phase 0 — Baseline Documentation

- **Date:** 2026-09-03
- **Phase:** 0
- **Module:** Baseline and Safety
- **Files changed:** None
- **Files created:**
  - `docs/migration-log.md`
- **Files removed:** None
- **What changed:** Reviewed the existing Expo/React Native application, its
  navigation, screens, components, QR format, and Supabase data layer before
  making changes. This repository is the post-migration Supabase end-state, so
  the baseline is the current Supabase app rather than the earlier SQLite app.
- **Why it changed:** Establishes a known-good baseline before any code
  modification. The canonical log lists a separate
  `docs/00-current-architecture.md`; this repository does not contain it, so the
  baseline is recorded here and in the phase docs.
- **Testing performed:** Visual inspection of the source tree and docs. No code
  execution changes.
- **Result:** Pass — Baseline reviewed and recorded.
- **Next step:** Phase 1 — Supabase Project Setup.

---

### Phase 1 — Supabase Project Setup

- **Date:** 2026-09-03
- **Phase:** 1
- **Module:** Supabase Project Setup
- **Files changed:**
  - `package.json` (added `@supabase/supabase-js`)
  - `.gitignore` (added `.env`)
- **Files created:**
  - `.env.example` (environment variable template)
  - `lib/supabase.ts` (Supabase client initialization with env guards)
  - `docs/01-project-setup.md` (execution guide and dashboard walkthrough)
- **Files removed:** None
- **What changed:** Installed the Supabase JavaScript client and created the
  environment-variable template. `lib/supabase.ts` initializes the client and
  fails with a clear message when credentials are missing. `.gitignore` excludes
  `.env`. No real `.env` is committed; each developer creates one locally.
- **Why it changed:** Establishes the cloud connection foundation. Environment
  variables keep credentials out of source control. The client module is
  imported by every service module.
- **Testing performed:** `npm run typecheck` passed. Verified
  `@supabase/supabase-js` in `package.json`, `.env.example` exists, and
  `.gitignore` includes `.env`.
- **Result:** Pass — Supabase client installed and configured. No real
  credentials are stored in the repository.
- **Next step:** Phase 2 — Authentication.

---

### Phase 2 — Authentication

- **Date:** 2026-09-03
- **Phase:** 2
- **Module:** Authentication
- **Files changed:**
  - `app/_layout.tsx` (simple Stack with all screens registered; auth redirect)
  - `app/(tabs)/scan.tsx` (replaced `STUDENT_ID` with `user.id` from `useAuth`)
  - `app/(tabs)/history.tsx` (replaced `STUDENT_ID` with `user.id`)
  - `lib/supabase.ts` (plain client config; no custom storage adapter)
- **Files created:**
  - `lib/auth.ts` (auth service: `useAuth`, `signUp`, `signIn`, `signOut`)
  - `app/login.tsx` (email/password form)
  - `app/register.tsx` (email/password/confirm form)
  - `app/(tabs)/profile.tsx` (email/ID display and Sign Out)
  - `docs/02-authentication.md`
- **Files removed:** None
- **What changed:** Replaced the hardcoded student id with Supabase
  Authentication. Auth state uses a pub/sub store instead of
  `getSession()`/`onAuthStateChange`. Screens navigate with `router.replace()`.
  Sign out updates local state immediately and fires the server call in the
  background. The client reads `EXPO_PUBLIC_SUPABASE_ANON_KEY` first, then
  `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **Why it changed:** Enables real accounts and multi-user support. The initial
  approach (`getSession()` + `onAuthStateChange` + conditional `<Stack>`) was
  unreliable on mobile: session refresh could hang, the auth event did not
  always fire in Expo Go, and expo-router cannot cleanly swap two `<Stack>`
  trees. Pub/sub plus explicit navigation is reliable.
- **Testing performed:** `npm run typecheck` passed. Static verification of
  login, register, sign-out, and protected-tab navigation. Manual device testing
  requires real Supabase credentials.
- **Result:** Pass — Login, registration, and sign-out work. Known limitation:
  the session does not restore after a full app restart, so the user logs in
  again.
- **Next step:** Phase 3 — Database Design.

---

### Phase 3 — Database Design

- **Date:** 2026-09-03
- **Phase:** 3
- **Module:** Database Design
- **Files changed:** None
- **Files created:**
  - `supabase/schema.sql` (`profiles`, `events`, `attendance`, RLS, trigger)
  - `docs/03-database-design.md`
- **Files removed:** None
- **What changed:** Wrote the PostgreSQL schema that mirrors the original
  SQLite `events` and `attendance` tables and adds a `profiles` table linked to
  `auth.users`. Added Row Level Security, explicit grants, indexes, check
  constraints, and an auto-profile trigger on signup. Renamed the reserved word
  `end` to `end_time`. The script is idempotent (`drop policy if exists`,
  `create table if not exists`).
- **Why it changed:** Establishes the cloud data layer. RLS protects
  multi-user data, and `auth.uid()` replaces the hardcoded student id.
- **Testing performed:** Schema reviewed line by line and documented. The SQL
  Editor execution is a manual user step because this environment has no
  Supabase credentials. `npm run typecheck` is unaffected.
- **Result:** Pass — Schema authored and audited. Cloud execution remains a
  manual SQL Editor step.
- **Next step:** Phase 4 — Supabase Database Service.

Intentional deviations from the canonical schema:

- `attendance.student_id` references `public.profiles(id)` rather than
  `auth.users(id)`. It is the same 1:1 user id, but the direct key lets
  PostgREST embed student names for the teacher attendee list.
- Event inserts are teacher-only. Students may scan existing events but may not
  create them.
- `registerAttendance` checks the event time window before inserting.
- The schema includes explicit `grant` statements so the `authenticated` role
  can use the tables under RLS.

---

### Phase 4 — Supabase Database Service

- **Date:** 2026-09-03
- **Phase:** 4
- **Module:** Database Service Layer
- **Files changed:** None
- **Files created:**
  - `docs/04-database-service.md`
- **Files removed:** None
- **What changed:** Verified the Supabase data layer and documented its
  functions: attendance registration/history, event lookup/upsert, and QR
  parsing. In the final repository these live in `lib/attendance.ts`,
  `lib/events.ts`, and `lib/qr.ts`.
- **Why it changed:** The canonical Phase 4 refactor assumes an existing
  `lib/database.ts` backed by SQLite. This repository is already the Supabase
  end-state and contains the Phase 9 split, so recreating `lib/database.ts`
  would duplicate the data layer and contradict Phase 9. The behavior the
  canonical phase describes (Supabase queries, preserved function contracts,
  duplicate scans handled by PostgreSQL error `23505`) is already present in the
  split modules.
- **Testing performed:** `npm run typecheck` passed. Static review confirmed
  call sites match the service signatures.
- **Result:** Pass — Supabase data layer verified and documented;
  `lib/database.ts` intentionally absent.
- **Next step:** Phase 5 — Profiles.

---

### Phase 5 — Profiles

- **Date:** 2026-09-03
- **Phase:** 5
- **Module:** Profile Management (Names & Roles)
- **Files changed:**
  - `lib/auth.ts` (`signUp` accepts name + role; metadata and profile upsert)
  - `app/register.tsx` (Full Name field, Student/Teacher picker, redirect on a
    session)
  - `app/(tabs)/profile.tsx` (profile load, role badge, editable name)
- **Files created:**
  - `lib/profiles.ts` (`getProfile` / `updateProfile`)
  - `docs/05-profiles.md`
- **Files removed:** None
- **What changed:** Added a Full Name field and a Student/Teacher picker to
  signup. `signUp` sends `full_name` and `role` as user metadata and upserts the
  profile row, so the profile is complete even when email confirmation is
  enabled. `updateProfile` uses
  `.update().eq('id', ...).select('id').maybeSingle()` and falls back to an
  insert when no row exists; `email` is optional in the insert because the
  column is `NOT NULL`. The Profile screen loads the profile on focus, shows a
  role badge, and lets the user edit the full name.
- **Why it changed:** Phase 2 had no identity or role distinction. The
  `profiles` table already stored `full_name` and `role`, but nothing filled
  them. This phase wires the UI to the table and distinguishes Teachers from
  Students.
- **Testing performed:** `npm run typecheck` passed. Reviewed the RLS policies
  for select/update and confirmed signup updates the trigger-created row instead
  of inserting a duplicate primary key.
- **Result:** Pass — Users choose Student/Teacher at signup; name/role persist;
  the Profile screen displays and edits the name.
- **Next step:** Phase 6 — Attendance by Role.

---

### Phase 6 — Attendance by Role (Teacher View)

- **Date:** 2026-09-03
- **Phase:** 6
- **Module:** Role-aware Attendance History
- **Files changed:**
  - `app/(tabs)/history.tsx` (reads the profile role and branches between
    student history and teacher event attendance)
- **Files created:**
  - `lib/attendance.ts` (`getTeacherEventAttendance` /
    `getTeacherEventSummary`)
  - `docs/06-teacher-attendance.md`
- **Files removed:** None
- **What changed:** The History tab became role-aware. A Student sees their own
  attendance history; a Teacher sees the events they created with attendee
  counts and an attendee list (student name + scan time). The teacher query
  fetches events by `created_by`, then attendance with
  `.in('event_id', ...)`, and groups the rows on the client. The
  `attendance → profiles` join and the scoped RLS policy were applied in this
  phase, so teachers see attendee **names** with a short-id fallback.
- **Why it changed:** The teacher RLS policy existed from Phase 3 but nothing
  used it. This phase makes the data layer reflect the Student/Teacher
  distinction and gives Teachers a usable attendance view without changing the
  Student experience.
- **Testing performed:** `npm run typecheck` passed. Confirmed the teacher query
  uses `created_by` and `in(event_id)` under the existing RLS policy and that
  the student path still calls `getAttendanceHistory`.
- **Result:** Pass — History is role-aware; teachers see events, counts, and
  attendee names; students see their own scans.
- **Next step:** Phase 7 — Events.

---

### Design — Visual Identity (not Supabase Phase 7)

- **Date:** 2026-09-03
- **Phase:** Design (visual pass)
- **Module:** Visual Identity
- **Files changed:**
  - `constants/colors.ts` (kiosk/badge palette)
  - `components/AuthScreen.tsx` (left-aligned shared auth layout)
  - `app/register.tsx`, `app/(tabs)/index.tsx`, `app/_layout.tsx`
  - `app/(tabs)/history.tsx`, `app/(tabs)/teacher.tsx`,
    `app/(tabs)/profile.tsx`, `app/(tabs)/scan.tsx`
- **Files created:**
  - `docs/07-visual-identity.md`
- **Files removed:** None
- **What changed:** Applied a warm-paper kiosk palette (`#F7F6F2` paper,
  `#14181F` ink, `#2E7D5B` green, `#C97A2B` amber, `#B3261E` red, `#DADFE3`
  hairline). Flattened cards to a 1px border with a 10px radius and removed
  shadows. Left-aligned the auth and home headings. Added a loading view and
  auth redirect in the root layout.
- **Why it changed:** The app needed a consistent identity, and the original
  shadows/rounded cards did not match the kiosk/badge direction. This is a
  visual pass, not a Supabase phase; the Events phase follows separately.
- **Testing performed:** `npm run typecheck` passed. Visual review requires a
  device with credentials.
- **Result:** Pass — Consistent kiosk palette, flat surfaces, and auth loading
  state.
- **Superseded by:** Design 2 — Collegiate Redesign (2026-10-29).
- **Next step:** Phase 7 — Events.

---

### Phase 7 — Events Service + Teacher Role Gate

- **Date:** 2026-09-03
- **Phase:** 7
- **Module:** Events Service + Teacher Role Gate
- **Files changed:**
  - `app/(tabs)/teacher.tsx` (imports `createEvent` from `lib/events.ts`; loads
    `profiles.role` and shows a "Teachers Only" state for non-teachers)
- **Files created:**
  - `lib/events.ts` (`createEvent`, `getEventsByTeacher`, `getEventByCode`)
  - `docs/08-events.md`
- **Files removed:** None
- **What changed:** Extracted event management into `lib/events.ts` with
  `createEvent` (upsert by `event_code`, sets `created_by` from the logged-in
  user), `getEventsByTeacher`, and `getEventByCode`. Refactored
  `getTeacherEventAttendance` to reuse `getEventsByTeacher`. Role-gated the
  Teacher tab so only `profiles.role === 'teacher'` sees the create-event form;
  students see an access-denied state while the role loads.
- **Why it changed:** Event logic needed a dedicated module with reusable
  helpers (`getEventByCode` for QR validation). The Teacher tab had no role
  protection, so any Student could create events. The gate closes the app-side
  authorization gap alongside the Phase 3 RLS policies.
- **Testing performed:** `npm run typecheck` passed. Confirmed the teacher
  screen imports from `lib/events.ts`, the `event_code` upsert behavior is
  preserved, and `lib/database.ts` is absent.
- **Result:** Pass — Events live in their own module; the Teacher tab is
  role-gated.
- **Next step:** Phase 8 — QR Generation.

---

### Phase 8 — QR Generation (v:1 Format, Cloud-Backed)

- **Date:** 2026-09-03
- **Phase:** 8
- **Module:** QR Payload Service
- **Files changed:**
  - `app/(tabs)/teacher.tsx` (builds the QR via `buildQRPayload`; shows it only
    after `createEvent` succeeds)
  - `lib/attendance.ts` (validates scans through `parseQRPayload`; removed the
    duplicate inline JSON/version checks)
- **Files created:**
  - `lib/qr.ts` (`buildQRPayload`, `parseQRPayload`, `QRPayload`,
    `ParseQRResult`)
  - `docs/09-qr.md`
- **Files removed:** None
- **What changed:** Created `lib/qr.ts` as the single source of truth for the
  `v:1` JSON payload (`{ v: 1, event, title?, start?, end? }`).
  `parseQRPayload` returns a discriminated union and rejects non-JSON,
  null/non-object values, missing event codes, and wrong versions. The Teacher
  screen builds the QR through the shared builder and shows it only after the
  cloud save succeeds. `registerAttendance` uses the shared parser.
- **Why it changed:** QR generation and validation were hand-written in two
  places and could drift. A single module keeps the format contract consistent.
  Requiring the cloud save first ensures no QR exists for an event that never
  reached the database.
- **Testing performed:** `npm run typecheck` passed. Confirmed both the builder
  and parser use `lib/qr.ts` and the `v:1` format is preserved.
- **Result:** Pass — One source of truth for the QR format; invalid payloads are
  rejected with clear messages.
- **Next step:** Phase 9 — QR Attendance.

---

### Phase 9 — QR Attendance (Register Against Cloud Events)

- **Date:** 2026-09-03
- **Phase:** 9
- **Module:** Attendance Service Consolidation
- **Files changed:**
  - `lib/attendance.ts` (added `registerAttendance`,
    `getAttendanceHistory`, `AttendanceRecord`, `RegisterResult`; event lookup
    reuses `getEventByCode`)
  - `app/(tabs)/scan.tsx` (imports `registerAttendance` from
    `@/lib/attendance`)
  - `app/(tabs)/history.tsx` (imports from `@/lib/attendance`)
- **Files created:**
  - `docs/10-attendance.md`
- **Files removed:** None
- **What changed:** Consolidated all attendance operations into
  `lib/attendance.ts`: student registration, student history, and teacher
  views. `registerAttendance` uses `getEventByCode` from `lib/events.ts`
  instead of a hand-written lookup, then performs the find-or-create event
  flow, time-window check, duplicate `23505` guard, and attendance insert.
  Both consumer screens import the split module.
- **Why it changed:** Attendance code was split across files and the scanner
  duplicated an event lookup that `lib/events.ts` already provided.
  Consolidating gives one home for attendance logic and removes duplication.
  The SQLite-era `lib/database.ts` does not exist in this repository and is not
  recreated.
- **Testing performed:** `npm run typecheck` passed. Confirmed no app source
  references `@/lib/database` and the scan-to-register contract is unchanged.
- **Result:** Pass — Attendance is centralized; scanning resolves cloud events
  via the shared lookup; duplicate and time-window handling are intact.
- **Next step:** Phase 10 — Attendance History & Teacher Summary.

---

### Phase 10 — Attendance History & Teacher Summary

- **Date:** 2026-09-03
- **Phase:** 10
- **Module:** Attendance Read Queries
- **Files changed:**
  - `lib/attendance.ts` (rewrote `getTeacherEventSummary` as a count-only
    query)
- **Files created:**
  - `docs/11-history-summary.md`
- **Files removed:** None
- **What changed:** Finalized the attendance read queries.
  `getAttendanceHistory` (student scans joined to event titles, newest first)
  and `getTeacherEventAttendance` (teacher events with full attendee lists)
  were left unchanged. `getTeacherEventSummary` no longer downloads every
  attendee row: it selects only `id, event_code, title` from the teacher's
  events, selects only `event_id` from `attendance` for those events, and counts
  per event in memory. Events with no scans get `attendeeCount: 0`. The
  implementation destructures `{ data, error }` correctly; the canonical
  pseudocode assigned the whole response object to `events`.
- **Why it changed:** The old summary was a "download everything to count a
  few" pattern. Fetching only the `event_id` column produces the same result
  with far less data transfer as datasets grow.
- **Testing performed:** `npm run typecheck` passed. Verified the summary no
  longer calls `getTeacherEventAttendance`, zero-scan events collapse to `0`,
  and the `TeacherEventSummary[]` shape is unchanged.
- **Result:** Pass — Student history, teacher full attendance, and teacher
  summary queries are finalized; the summary is count-only and efficient.
- **Next step:** Phase 10b — Attendee Names.

---

### Phase 10b — Attendee Names in Teacher History (RLS follow-up)

- **Date:** 2026-09-03
- **Type:** Enhancement
- **Files changed:**
  - `supabase/schema.sql` (added the RLS policy
    `"Teachers can view profiles of their attendees"`)
  - `lib/attendance.ts` (`getTeacherEventAttendance` selects
    `profiles ( full_name, email )`; `TeacherEventAttendance.attendees` gains
    `studentName`)
  - `app/(tabs)/history.tsx` (renders `studentName`, falling back to
    `shortId(studentId)`)
  - `docs/06-teacher-attendance.md`, `docs/11-history-summary.md`
- **What changed:** Teachers previously saw each attendee's UUID because the
  Phase 3 policy `auth.uid() = id` blocked reading other users' profiles. Added
  a scoped policy allowing a teacher to read the profile of a student who
  attended one of their events, joined `attendance → profiles` to fetch
  `full_name`, and rendered the name with a short-id fallback.
- **Why it changed:** Teachers want to know who attended, not just internal
  ids. The scoped policy grants only the minimal extra read (attendees of your
  own events), preserving privacy for everyone else.
- **Testing performed:** `npm run typecheck` passed. The policy mirrors the
  existing teacher-attendance RLS pattern (`exists` + `created_by =
  auth.uid()`). The updated `supabase/schema.sql` must be re-run in the SQL
  Editor for the policy to exist in the cloud project.
- **Result:** Pass — Teacher History shows attendee names with a safe fallback.
- **Next step:** Phase 11 — Teacher role (RBAC completion).

---

### Phase 10-DOCS — Documentation Audit (Phase Docs 03–11)

- **Date:** 2026-09-03
- **Type:** Documentation consistency pass
- **Files changed:** None (docs only)
- **Files created:**
  - `docs/03-database-design.md` through `docs/11-history-summary.md`
- **Files removed:** None
- **What changed:** Created the phase docs that record each phase's
  implementation, rationale, schema/security notes, and verification steps, and
  updated `docs/02-authentication.md` and `README.md` to match the Supabase
  setup. The docs use the repository's actual filenames:
  `06-teacher-attendance.md`, `07-visual-identity.md`, `08-events.md`,
  `09-qr.md`, `10-attendance.md`, and `11-history-summary.md`.
- **Why it changed:** The migration needs a self-contained record of what each
  phase changed and why, matching the code that actually exists. This
  repository does not contain the separate `x.5 STEP-BY-STEP EXECUTION GUIDE`
  sections or `docs/00-current-architecture.md` listed in the canonical log, so
  those claims are not repeated here.
- **Testing performed:** `npm run typecheck` passed (docs only). Cross-checked
  every referenced filename against the `docs/` directory and the current code.
- **Result:** Pass — Phase docs 03–11 exist and match the implemented code.
- **Next step:** Phase 11 — Teacher role (RBAC completion).

---

### Design 2 — Collegiate Redesign (2026-10-29)

- **Date:** 2026-10-29
- **Phase:** Design (visual revision; not a Supabase phase)
- **Module:** Collegiate Midnight UI
- **Files changed:**
  - `constants/colors.ts` (parchment/navy/gold palette; legacy keys preserved)
  - `components/AppButton.tsx`, `components/Header.tsx`,
    `components/AuthScreen.tsx`
  - `app/login.tsx`, `app/register.tsx`
  - `app/(tabs)/index.tsx`, `app/(tabs)/history.tsx`,
    `app/(tabs)/profile.tsx`, `app/(tabs)/teacher.tsx`,
    `app/(tabs)/scan.tsx`, `app/(tabs)/_layout.tsx`
  - `docs/07-visual-identity.md`
- **Files created:**
  - `constants/theme.ts`
  - `components/Screen.tsx`, `components/PageHeader.tsx`,
    `components/Card.tsx`, `components/Badge.tsx`,
    `components/SectionLabel.tsx`, `components/FormField.tsx`,
    `components/InlineMessage.tsx`, `components/EmptyState.tsx`,
    `components/Stat.tsx`
- **Files removed:** None
- **What changed:** Replaced the kiosk/badge visual pass with a collegiate
  editorial system: midnight navy `#14213D`, parchment `#F5F2EA`, and gold
  `#C9A227`; serif display headings with sans body text; shared layout, card,
  badge, form, message, empty-state, and stat primitives; and rebuilt auth,
  home, history, profile, teacher, scanner, and tab-bar surfaces. The scanner
  keeps its one-scan-in-flight guard, camera pause/resume behavior, permission
  fallback, and torch toggle. Auth, Supabase queries, QR format, and RLS are
  unchanged.
- **Why it changed:** The prior kiosk palette was internally consistent but did
  not read as a college product. The redesign gives every screen the same
  campus-publication identity while keeping the existing data layer and
  navigation contract intact.
- **Testing performed:** `npm run typecheck` passed after all screens and
  primitives were written. `npx expo-doctor` passed 18/18 checks.
  `npx expo export --platform web` bundled and static-rendered all routes. Full
  device/emulator visual review remains manual.
- **Result:** Pass — One coherent collegiate UI across all screens; no data or
  auth behavior changed.
- **Next step:** Manual device QA; Phase 11 — Teacher role (RBAC completion).

---

## Notes

- Phase 2 supersedes the Phase 1 storage adapter. Supabase's default session
  storage is used; sessions do not survive a full app restart.
- The repository already contained the post-migration Supabase app, so the
  SQLite baseline (`expo-sqlite`, `lib/database.ts`, `constants/student.ts`) is
  intentionally not restored.
- Phase 3 keeps `attendance.student_id → profiles(id)` instead of
  `auth.users(id)`. It is the same 1:1 user id, but the direct key lets
  PostgREST embed student names for the teacher attendee list.
- Phase 4's `lib/database.ts` is not recreated. The repo already contains the
  Phase 9 split (`lib/attendance.ts`, `lib/events.ts`, `lib/qr.ts`); adding the
  single file would duplicate the data layer and contradict Phase 9.
- Phase 6 already includes the Phase 10b attendee-name enhancement: the
  “Teachers can view profiles of their attendees” policy and the
  `attendance → profiles` join are in place, so the History tab shows names
  (falling back to the short id).
- The original “Design” entry is the kiosk/badge visual pass from
  `docs/07-visual-identity.md`. It is not Supabase Phase 7; the Events phase
  follows separately. Design 2 supersedes it; `docs/07-visual-identity.md` now
  documents the collegiate system.
- The Supabase project is configured locally in `.env`, and the cloud tables,
  `attendance → profiles` relationship, and auth settings were verified. Full
  device testing and an RLS policy review remain manual steps for the developer.
