import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { checkRateLimit, resetRateLimits } from '../services/security';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const loginAttempts = useRef(0);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase || !isSupabaseConfigured) {
      return { error: 'Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.' };
    }

    // Brute-force protection: max 5 login attempts per IP per 30 seconds
    const ipKey = `auth:login:${email}`;
    if (!checkRateLimit(ipKey, 5, 30000)) {
      return { error: 'Too many login attempts. Please wait 30 seconds before trying again.' };
    }

    // Password validation on client side
    if (password.length < 6) {
      return { error: 'Password must be at least 6 characters' };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    // Track failed attempts for additional protection
    if (error) {
      loginAttempts.current += 1;
      // If too many total failed attempts, add extra delay
      if (loginAttempts.current > 20) {
        // Reset rate limits to force a fresh wait on next attempt
        resetRateLimits();
        loginAttempts.current = 0;
        return { error: 'Account temporarily locked due to too many failed attempts. Try again in a few minutes.' };
      }
    } else {
      loginAttempts.current = 0;
    }

    return { error: error?.message || null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase || !isSupabaseConfigured) {
      return { error: 'Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.' };
    }

    // Brute-force protection: max 3 signup attempts per email per 60 seconds
    const signupKey = `auth:signup:${email}`;
    if (!checkRateLimit(signupKey, 3, 60000)) {
      return { error: 'Too many signup attempts. Please wait before trying again.' };
    }

    // Stronger password validation
    if (password.length < 8) {
      return { error: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { error: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { error: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { error: 'Password must contain at least one number' };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error?.message || null };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      configured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
