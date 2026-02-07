'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { database } from '@/api/database';

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  signUp: (email: string, password: string, role: string) => Promise<{ success: boolean; error?: any }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await database
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    return error ? null : data?.role ?? null;
  };

  useEffect(() => {
    // Get initial session
    database.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      session?.user ? 
        fetchUserRole(session.user.id).then(setRole) : 
        setRole(null);
      setLoading(false);

    });

    // Listen for auth changes
    const { data: { subscription } } = database.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      session?.user ? 
        fetchUserRole(session.user.id).then(setRole) : 
        setRole(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userRole: string) => {
    const { data: authData, error: authError } = await database.auth.signUp({
      email,
      password,
    });

    const userCreated = authData?.user && !authError;

    const roleResult = userCreated && authData.user ?
      await database.from('user_roles').insert({
        user_id: authData.user.id,
        role: userRole,
      }) :
      { data: null, error: authError };

    return roleResult.error ?
      { success: false, error: roleResult.error } :
      { success: true };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await database.auth.signInWithPassword({
      email,
      password,
    });

    return error ?
      { success: false, error } :
      { success: true };
  };

  const signOut = async () => {
    await database.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context ?? (() => { throw new Error('useAuth must be used within AuthProvider'); })();
};
