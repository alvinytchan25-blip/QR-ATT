# Phase 2 — Authentication

## Goal

Replace the hardcoded `STUDENT-2026-001` identity with real Supabase accounts.
Users must register and sign in before using the app.

## Implementation

| File | Change |
|---|---|
| `lib/supabase.ts` | Plain client config; no custom storage adapter |
| `lib/auth.ts` | Global auth state with a pub/sub store (`setAuth`, `useAuth`, `signUp`, `signIn`, `signOut`) |
| `app/login.tsx` | Email/password form; `router.replace('/(tabs)')` after sign in |
| `app/register.tsx` | Email/password/confirm form at this phase; Phase 5 adds full name + role |
| `app/_layout.tsx` | Single stack with auth-based redirect to `/login` |
| `app/(tabs)/profile.tsx` | Shows email + user ID at this phase; Phase 5 adds name/role |
| `app/(tabs)/scan.tsx` | Uses the authenticated `user.id` |
| `app/(tabs)/history.tsx` | Uses the authenticated `user.id` |

Auth operations update the global store directly, so no `getSession()` or
`onAuthStateChange()` call is needed. Sign-out clears local state first and
notifies Supabase in the background.

## Known Limitations

1. No session restore after a full app restart (the auth store is in memory).
2. `signOut()` is fire-and-forget; the server is notified asynchronously.
3. Token refresh events are not observed, so long-running sessions may expire
   without a UI notification.

## Test Checklist

| # | Test | Expected |
|---|---|---|
| 1 | App starts | Login screen, not tabs |
| 2 | Open Sign Up | Registration screen |
| 3 | Register | Account created in Supabase |
| 4 | Sign in | Tabs appear |
| 5 | Profile tab | Email + user ID |
| 6 | Sign Out | Login screen |
| 7 | Wrong password | Error message |
| 8 | Scan tab | Camera opens |
| 9 | History tab | Records or empty state |

## Verification

```powershell
npm run typecheck
```
