# QR Attendance App — Setup & Testing Guide

> **Target:** First-year students | **Expo SDK:** 54 | **Expo Go:** 54.0.8
> Students scan a teacher's event QR code to record attendance.

---

## PREREQUISITES

| Tool | Download | Verify |
|---|---|---|
| Node.js (LTS) | https://nodejs.org/en | `node --version` |
| VS Code | https://code.visualstudio.com | (open it) |
| Expo Go 54.0.8 | Play Store → "Expo Go" | (version in app settings) |
| Supabase account | https://supabase.com | (free tier is fine) |

---

## STEP 1 — Install Dependencies

```powershell
cd C:\Users\admin\Benigay_midterm_act
npm install
```

---

## STEP 2 — Create the Supabase Project

1. Go to https://supabase.com/dashboard and create a new project.
2. Wait for the database to finish provisioning.
3. In the left sidebar scroll to the **bottom** and open
   **Project Settings → API Keys**, then copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - the **anon public** key (older projects) or the **Publishable** key
     (`sb_publishable_...`, newer projects)

> There is no longer a "Project Settings → API" page; that section was replaced
> by **API Keys**. If you only see a *Create new API keys* button, click it, name
> the key `default`, and the publishable key will appear.
>
> Use the **anon public** or **Publishable** key, never the **Secret** key
> (`sb_secret_...`). The secret key bypasses Row Level Security and must never
> ship in an app.

---

## STEP 3 — Create the Tables

1. In the Supabase dashboard open **SQL Editor → New query**.
2. Paste the **entire** contents of `supabase/schema.sql`.
3. Click **Run**.

You should see `Success. No rows returned`. Verify under **Table Editor** that
`profiles`, `events` and `attendance` all exist.

> The script is idempotent — running it again is safe. It also repairs databases
> created from an older version of the file.
>
> `schema.sql` includes explicit `GRANT` statements. These are **not** redundant
> with Row Level Security and must not be removed: since May 2026 Supabase no
> longer exposes new `public` tables to the Data API by default, so without the
> grants the app fails with `permission denied for table ...` (code `42501`)
> even though the tables are visible in Table Editor. Grants control *whether*
> a role can touch a table; RLS controls *which rows* it can see.
>
> A commented-out verification query is at the end of `schema.sql`. Paste it
> into the SQL Editor on its own afterwards to confirm the tables, RLS flags and
> grants all landed.

---

## STEP 4 — Configure Auth

1. **Authentication → Sign In / Providers → Email**
2. Turn **off** "Confirm email" (this makes testing much faster).
3. Click **Save**.

> If you leave confirmation ON, the app still works — the Teacher/Student role
> you pick at registration is saved through signup metadata — but you must click
> the confirmation link before you can sign in.

---

## STEP 5 — Create the `.env` File

```powershell
copy .env.example .env
```

Then open `.env` and paste your two values from STEP 2:

```env
EXPO_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # or sb_publishable_...
```

No `export` prefix, no quotes, no spaces around `=`. The `EXPO_PUBLIC_` prefix
is required — without it Expo ignores the variable.

> `.env` is already in `.gitignore`. Never commit it, and never use the
> `sb_secret_...` key here — the anon/publishable key is the only one that
> belongs in a client app. It is safe to expose by design: your real protection
> is the Row Level Security policies in `schema.sql`, not key secrecy.
>
> The app reads `EXPO_PUBLIC_SUPABASE_ANON_KEY`. If your project only shows a
> publishable key, you may use `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` instead —
> both names are accepted.

---

## STEP 6 — Start the App

```powershell
npx expo start --clear
```

The `--clear` is required the first time after creating `.env`. Metro reads
environment variables once when it builds the bundle, so reloading the browser
without restarting will keep showing the old "Missing Supabase config" error.

Scan the QR code with the **Expo Go** app on your phone, or press `W` to run in
a browser.

> This project does not include `expo-dev-client`, so the printed QR code opens
> in Expo Go directly — no native toolchain required. If you ever need a custom
> development build, re-install `expo-dev-client` and re-add the
> `developmentClient: true` EAS profile.

---

## STEP 7 — Test the Two Roles

You need **two accounts** to test properly.

| Account | How to create |
|---|---|
| Teacher | Register → pick **Teacher** |
| Student | Register → pick **Student** |

### Teacher flow
1. Sign in as the teacher.
2. Open the **Teacher** tab.
3. Enter an Event Title (e.g. `Founders Day`) and an Event Code (e.g. `EVT-001`).
4. Set **Starts** / **Ends**, or tap a quick chip like `+1 hour`.
5. Tap **Create Event**. A QR code appears on screen.

### Student flow
1. Sign in as the student (on a second device, or sign out and back in).
2. Open the **Scan** tab and allow camera access.
3. Point the camera at the teacher's QR code.
4. You should see **"Attendance recorded!"**.

### Verify
1. Open the **History** tab.
   - As the **student**: shows the event you just scanned.
   - As the **teacher**: shows the event with the attendee count and student name.
2. Scan the **same** QR again → "Already registered for this event."

### Also check
- **Profile** tab: tap your name, edit it, save, and confirm it persists.
- **Sign Out** returns you to the login screen. The Phase 2 auth store lives in
  memory, so a full app restart also returns you to the login screen — sign in
  again. (Session persistence can be added later with a storage adapter.)

---

## VERIFYING THE CODE

```powershell
npm run typecheck
```

Should print nothing and exit 0.

---

## PROJECT STRUCTURE

```
app/                        expo-router file-based routes
  _layout.tsx               root stack + auth redirect
  login.tsx  register.tsx   auth screens
  +not-found.tsx            404 screen
  (tabs)/
    _layout.tsx             bottom tab bar
    index.tsx               home
    scan.tsx                camera QR scanner
    history.tsx             student + teacher history
    profile.tsx             profile, name editing, sign out
    teacher.tsx             teacher-only event + QR generator
components/                 shared UI (buttons, cards, forms, feedback)
constants/colors.ts         collegiate palette
constants/theme.ts          type, spacing, radius, shadow tokens
lib/
  supabase.ts               client (Supabase default session storage)
  auth.ts                   session store, sign in/up/out
  events.ts  attendance.ts  profiles.ts  qr.ts
supabase/schema.sql         tables, grants, RLS policies, triggers
```

---

## TROUBLESHOOTING

| Problem | Solution |
|---|---|
| npm install fails | `npm install --legacy-peer-deps` |
| "Missing Supabase config" on launch | `.env` is missing, or the dev server was not restarted **with `--clear`**. Metro caches env vars, so a plain reload keeps failing. Use `npx expo start --clear` |
| `permission denied for table ...` (code `42501`) | The `GRANT` statements are missing. Re-run the whole of STEP 3 — the grants are in `schema.sql` |
| "Invalid API key" | The secret key (`sb_secret_...`) was pasted instead of the publishable one |
| "fetch failed" / network error | Project may still be provisioning (wait 2 min), or the Project URL was copied with a trailing slash |
| "Invalid login credentials" | Confirm the user exists under Authentication → Users |
| Register succeeds but you stay on the login screen | "Confirm email" is still on. Turn it off in **Authentication → Sign In / Providers → Email** |
| Teacher tab says "Teachers Only" | The account's `role` is `student`. Change it in **Table Editor → profiles → role** |
| QR won't scan | Phone and computer on the same WiFi; make the QR fill more of the frame |
| Teacher history shows no attendees | Re-run STEP 3 — an old database is missing the `attendance → profiles` foreign key |
| Camera permission never granted | The `expo-camera` config plugin is required; it is already in `app.json` |
| White screen | Wait 10s, then shake → Reload |
| TypeScript errors | `npm run typecheck` |
