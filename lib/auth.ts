import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from './supabase';

export type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

// Module-level state shared by every component that calls useAuth().
// Auth operations update it directly and notify subscribers, which avoids
// getSession()/onAuthStateChange() hanging on some React Native setups.
let globalSession: Session | null = null;
let globalUser: User | null = null;
let globalLoading = false;
const listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

export function setAuth(session: Session | null) {
  globalSession = session;
  globalUser = session?.user ?? null;
  globalLoading = false;
  notify();
}

export function useAuth(): AuthState {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const listener = () => forceRender((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    session: globalSession,
    user: globalUser,
    loading: globalLoading,
  };
}

export type SignUpProfile = {
  full_name: string;
  role: 'student' | 'teacher';
};

export async function signUp(
  email: string,
  password: string,
  profile?: SignUpProfile
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Also stored in user_metadata so the handle_new_user trigger can create
    // the profile row even when email confirmation is enabled.
    options: profile
      ? { data: { full_name: profile.full_name, role: profile.role } }
      : undefined,
  });

  if (!error && data.session) {
    if (profile) {
      // Upsert rather than update: the trigger may not have created the row yet.
      await supabase
        .from('profiles')
        .upsert(
          {
            id: data.session.user.id,
            email,
            full_name: profile.full_name,
            role: profile.role,
          },
          { onConflict: 'id' }
        );
    }
    setAuth(data.session);
  }

  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (!error && data.session) {
    setAuth(data.session);
  }

  return { data, error };
}

export async function signOut(): Promise<{ error: string | null }> {
  // Clear local state first so navigation is instant, then end the server
  // session in the background (awaiting it can hang on mobile).
  setAuth(null);
  supabase.auth.signOut().catch(() => {});
  return { error: null };
}
