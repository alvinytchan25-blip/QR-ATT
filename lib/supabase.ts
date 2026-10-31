import { createClient } from '@supabase/supabase-js';

// Phase 2 uses Supabase's default session storage. No custom adapter:
// SecureStore/AsyncStorage adapters caused session restore to hang on mobile.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase config. Copy .env.example to .env, set ' +
      'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart ' +
      'with "npx expo start --clear".'
  );
}

if (
  /your-|your_|example|placeholder|changeme/i.test(supabaseUrl + supabaseAnonKey)
) {
  throw new Error(
    'Supabase config still contains sample text. Open .env and paste your real ' +
      'Project URL and anon/publishable key, then restart with "npx expo start --clear".'
  );
}

if (supabaseAnonKey.startsWith('sb_secret_')) {
  throw new Error(
    'This is the Supabase SECRET key (sb_secret_...). Replace it with the ' +
      'anon/publishable key; the secret key bypasses Row Level Security.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
