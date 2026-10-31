# Phase 1 — Supabase Project Setup

## Goal

Connect the Expo app to a Supabase project and keep credentials out of source
code.

## Files

| File | Purpose |
|---|---|
| `lib/supabase.ts` | Creates and exports the Supabase client |
| `.env.example` | Template for the required environment variables (safe to commit) |
| `.env` | Real values (gitignored, never commit) |

## Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

The app also accepts `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for projects whose
dashboard only shows a publishable key.

The `EXPO_PUBLIC_` prefix is required — without it Expo will not load the value.
Never use the `sb_secret_...` key in a client app; it bypasses Row Level Security.

## Storage Adapter Note

Phase 1 originally suggested `expo-secure-store`. Phase 2 supersedes that: the
client now uses Supabase's default in-memory session storage and no custom
adapter, because custom adapters caused session restore to hang on mobile.

## Commands

```powershell
npm install
copy .env.example .env   # then paste the real URL and key
npx expo start --clear
```

## Verification

```powershell
npm run typecheck
npx expo install --check
```

Both should complete without errors.
