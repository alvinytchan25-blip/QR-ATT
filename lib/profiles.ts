import { supabase } from './supabase';

export type Role = 'student' | 'teacher';

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: { full_name?: string; role?: Role },
  email?: string
): Promise<{ error: string | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('id')
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  // The handle_new_user trigger normally creates the row. If it is missing
  // (for example an account created before the trigger existed), create it.
  // `email` is NOT NULL, so it is required for this fallback.
  if (!data) {
    if (!email) {
      return { error: 'Profile not found. Please sign in again.' };
    }
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ id: userId, email, ...updates });
    return { error: insertError?.message ?? null };
  }

  return { error: null };
}
