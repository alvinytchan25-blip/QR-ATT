# Phase 5 — Profiles (Names & Roles)

## Goal

Collect a full name and a Student/Teacher role at signup, store them in the
cloud `profiles` table, and show/edit them on the Profile tab.

## Files

| File | Change |
|---|---|
| `lib/profiles.ts` | `Role`, `Profile`, `getProfile`, `updateProfile` |
| `lib/auth.ts` | `signUp` accepts `SignUpProfile`, sends metadata, upserts the profile |
| `app/register.tsx` | Full Name field, Student/Teacher chips, redirect to tabs on session |
| `app/(tabs)/profile.tsx` | Profile loaded on focus, role badge, editable name, email, ID, sign out |

## Flow

1. The register screen calls
   `signUp(email, password, { full_name, role })`.
2. Supabase creates the auth user. The `handle_new_user` trigger creates the
   matching `profiles` row, reading `full_name`/`role` from the signup metadata
   when present.
3. If a session exists, `lib/auth.ts` upserts the profile with
   `id`, `email`, `full_name`, and `role`, then calls `setAuth`.
4. The register screen navigates with `router.replace('/(tabs)')`. If email
   confirmation is on (no session), it shows the “check your email” screen.
5. The Profile tab loads the row with `getProfile(user.id)` on every focus.
   Saving a new name calls `updateProfile(user.id, { full_name })`.

## Why UPDATE, not INSERT

The Phase 3 trigger already inserted the profile row. Inserting again would
violate `profiles_pkey`. `updateProfile` therefore runs an update scoped to
`auth.uid()`, and only inserts when the update matched no row (for example an
account created before the trigger existed).

Because `profiles.email` is `NOT NULL`, the missing-row insert needs an email;
`updateProfile` accepts it as an optional third argument and the Profile screen
passes `user.email`.

## Intentional differences from the lab text

1. **`updateProfile` has an optional `email` parameter** so the fallback insert
   can satisfy the `NOT NULL` email column.
2. **`signUp` sends `full_name`/`role` in `user_metadata`** and upserts the row.
   This keeps the trigger's profile complete even when email confirmation is on
   and no session is returned immediately.
3. **Registration requires a non-empty full name.**
4. **Role badge colors:** teacher uses the primary color, student uses the
   surface color.

## Testing

1. `npm run typecheck` — no errors.
2. Register a **Teacher** → land on tabs → Profile shows the Teacher badge and
   the name; `profiles.role = 'teacher'` in Supabase.
3. Register a **Student** → Profile shows the Student badge.
4. Tap the name → edit → Save → the new name appears and
   `profiles.full_name` updates in Supabase.
5. Sign out and sign back in; the profile persists.
6. A user only sees their own profile (RLS).
