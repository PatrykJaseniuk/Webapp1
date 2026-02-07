'use client';
<<<<<<< HEAD
import { createContext, useContext, useEffect, useState } from 'react';
import { database } from '@/api/database';

interface AuthContextType {
    user: any | null;
    role: string | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<any>;
    signUp: (email: string, password: string, role: string) => Promise<any>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const { data: { user } } = await database.auth.getUser();

            user && setUser(user);
            user && database
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .single()
                .then(({ data: roleData }) => setRole(roleData?.role ?? null));

            setLoading(false);
        };

        initAuth();

        const { data: { subscription } } = database.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            currentUser ?
                database
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', currentUser.id)
                    .single()
                    .then(({ data: roleData }) => setRole(roleData?.role ?? null)) :
                setRole(null);

            setLoading(false);
        });

        return () => subscription?.unsubscribe();
    }, []);

    const value = {
        user,
        role,
        loading,
        signIn: async (email: string, password: string) => {
            const result = await database.auth.signInWithPassword({ email, password });
            return result;
        },
        signUp: async (email: string, password: string, role: string) => {
            const authResult = await database.auth.signUp({ email, password });
            authResult.error && authResult;

            const user = authResult.data.user;
            !user && { error: { message: 'User creation failed' } };

            const roleResult = await database.from('user_roles').insert({
                user_id: user?.id ?? '',
                role,
            });
            return roleResult.error ?
                { error: roleResult.error } :
                { data: authResult.data };
        },
        signOut: async () => {
            await database.auth.signOut();
            setUser(null);
            setRole(null);
        },
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
=======

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { database } from '@/api/database';

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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

  const signUp: AuthContextType['signUp'] = async (email: string, password: string) => {
    const { data: authData, error: authError } = await database.auth.signUp({
      email,
      password,
    });

    return authError ?
      { success: false, error: authError.message } :
      { success: true };
  };

  const signIn: AuthContextType['signIn'] = async (email: string, password: string) => {
    const { data, error } = await database.auth.signInWithPassword({
      email,
      password,
    });

    return error ?
      { success: false, error: error.message } :
      { success: true };
  };

  const signOut: AuthContextType['signOut'] = async () => {
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
>>>>>>> LLM(claude-haiku-4-5)
