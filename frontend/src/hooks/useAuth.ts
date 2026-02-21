'use client';
import { useState } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { database } from '@/api/database';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    session: Session | null;
}

export const useAuth = () => {
    const [auth, setAuth] = useState<AuthState>({ user: null, session: null });

    const initialLoad = useAsync(async () => {
        const {
            data: { session },
        } = await database.auth.getSession();
        setAuth({ user: session?.user ?? null, session });

        const {
            data: { subscription },
        } = database.auth.onAuthStateChange((_event, session) => {
            setAuth({ user: session?.user ?? null, session });
        });
        return () => subscription.unsubscribe();
    }, []);

    const [loginState, login] = useAsyncFn(
        async (email: string, password: string) => {
            const { data, error } = await database.auth.signInWithPassword({ email, password });
            return { data, error };
        },
        [],
    );

    const [signupState, signup] = useAsyncFn(
        async (email: string, password: string) => {
            const { data, error } = await database.auth.signUp({ email, password });
            return { data, error };
        },
        [],
    );

    const [, logout] = useAsyncFn(async () => {
        const { error } = await database.auth.signOut();
        return { error };
    }, []);

    return {
        user: auth.user,
        session: auth.session,
        isAuthenticated: !!auth.session,
        loading: initialLoad.loading,
        login,
        loginState,
        signup,
        signupState,
        logout,
    };
};
