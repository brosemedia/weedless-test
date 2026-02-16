import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import { markSignedIn, markSignedOut } from '../lib/authPrefs';

type Profile = Database['public']['Tables']['profiles']['Row'];

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: Error | null; session: Session | null; emailConfirmationRequired: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUserIdRef = useRef<string | null>(null);

  // Helper function to reset all stores
  const resetAllStores = async () => {
    try {
      // Reset onboarding store
      const { useOnboardingStore } = await import('../onboarding/store');
      useOnboardingStore.getState().reset();
      
      // Reset app store
      const { useApp } = await import('../store/app');
      useApp.getState().resetAll();
      
      // Reset legacy store
      const { useStore } = await import('../store/useStore');
      useStore.getState().clearAll();
      
      console.log('All stores reset');
    } catch (error) {
      console.error('Error resetting stores:', error);
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        // Only log non-PGRST116 errors (PGRST116 means "no rows found", which is expected)
        if (error.code !== 'PGRST116') {
          console.error('Error loading profile:', error);
        }
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        lastUserIdRef.current = session.user.id;
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUserId = session?.user?.id ?? null;
      
      // If a different user is signing in, reset all stores
      const currentLastUserId = lastUserIdRef.current;
      if (event === 'SIGNED_IN' && newUserId && currentLastUserId && newUserId !== currentLastUserId) {
        console.log('Different user signing in - resetting stores');
        await resetAllStores();
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      if (newUserId) {
        lastUserIdRef.current = newUserId;
      }
      
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
        lastUserIdRef.current = null;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) {
      await markSignedIn();
    }
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return { error: authError, session: null, emailConfirmationRequired: true };
    }

    if (!data.user) {
      return { error: new Error('User creation failed'), session: null, emailConfirmationRequired: true };
    }

    let activeSession: Session | null = data.session ?? null;

    // Wait for trigger to potentially create profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if profile exists
    let profileExists = false;
    let retries = 3;
    
    while (retries > 0 && !profileExists) {
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking profile:', checkError);
      }

      if (existingProfile) {
        profileExists = true;
        // Update full_name if provided
        if (fullName && existingProfile.full_name !== fullName) {
          await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('user_id', data.user.id);
        }
      } else {
        // Try to create profile manually
        // Note: id is auto-generated by the database, so we don't include it
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            email: data.user.email ?? email,
            full_name: fullName ?? null,
            // id is not included - it will be auto-generated by uuid_generate_v4()
            // created_at and updated_at will be auto-generated by DEFAULT NOW()
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          
          // Handle specific database errors
          if (profileError.code === '23502') {
            // null value in column - database structure issue
            console.error('Database structure error: id column missing DEFAULT. Please run FIX_ID_COLUMN.sql');
          return {
            error: new Error(
              'Datenbank-Konfigurationsfehler: Die id-Spalte hat keinen DEFAULT-Wert. Bitte fuehren Sie FIX_ID_COLUMN.sql aus.'
            ),
            session: activeSession,
            emailConfirmationRequired: !activeSession,
          };
          }
          
          if (profileError.code === '23503') {
            // Foreign key constraint violation
            console.error('Database structure error: Foreign key constraint issue. Please run COMPLETE_FIX.sql');
            return {
              error: new Error(
                'Datenbank-Konfigurationsfehler: Foreign Key Constraint Problem. Bitte fuehren Sie COMPLETE_FIX.sql aus.'
              ),
              session: activeSession,
              emailConfirmationRequired: !activeSession,
            };
          }
          
          // If it's a permission error, the trigger should handle it
          if (profileError.code === '42501' || profileError.message.includes('permission')) {
            // Wait a bit more and check again
            await new Promise(resolve => setTimeout(resolve, 1000));
            retries--;
            continue;
          }
          
          // Return error only if it's not a permission issue
          return {
            error: new Error(
              `Profil konnte nicht erstellt werden: ${profileError.message}. Bitte pruefen Sie die Datenbank-Konfiguration.`
            ),
            session: activeSession,
            emailConfirmationRequired: !activeSession,
          };
        } else {
          profileExists = true;
        }
      }
      retries--;
    }

    if (!profileExists) {
      return {
        error: new Error(
          'Registrierung erfolgreich, aber Profil konnte nicht erstellt werden. Bitte versuchen Sie sich anzumelden.'
        ),
        session: activeSession,
        emailConfirmationRequired: !activeSession,
      };
    }

    // After successful registration, try to get the session
    // This works even if email confirmation is required (user will be logged in after confirmation)
    const { data: { session } } = await supabase.auth.getSession();
    activeSession = session ?? activeSession ?? null;
    if (session) {
      setSession(session);
      setUser(session.user);
      await loadProfile(session.user.id);
      await markSignedIn();
    }

    return { error: null, session: activeSession, emailConfirmationRequired: !activeSession };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    lastUserIdRef.current = null;
    await markSignedOut();
    
    // Reset all local stores when signing out
    // This ensures that when switching accounts, old data doesn't persist
    await resetAllStores();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'hazeless://reset-password',
    });
    return { error };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (!error && profile) {
      setProfile({ ...profile, ...updates });
    }

    return { error };
  };

  const value: AuthContextType = {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
