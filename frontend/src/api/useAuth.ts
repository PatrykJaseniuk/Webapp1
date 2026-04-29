'use client';
import { useState, useEffect } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { database } from '@/api/database';
import type { User, Session } from '@supabase/supabase-js';

// ── Types ───────────────────────────────────────────────────────────

interface AuthState {
    user: User | null;
    session: Session | null;
}

// ── Hook ────────────────────────────────────────────────────────────

export const useAuth = () => {
    const [auth, setAuth] = useState<AuthState>({ user: null, session: null });
    const [authLoading, setAuthLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    // ── Auth subscription ───────────────────────────────────────────
    useEffect(() => {
        (async () => {//Async IIFE
            const dbResult = await database.auth.getSession()
            setAuthError(dbResult.error?.message ?? null)
            setAuthLoading(false);
            setAuth({ user: dbResult.data.session?.user ?? null, session: dbResult.data.session })
        })()

        const { data: { subscription } } = database.auth.onAuthStateChange(
            (_event, session) => {
                setAuth({ user: session?.user ?? null, session });
            }
        );
        return () => subscription.unsubscribe();
    }, []);

    const roleResult = useAsync(
        async () =>
            auth.user ?
                await database
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', auth.user.id)
                    .single() :
                null,
        [auth.user?.id]
    )

    // ── Actions ────────────────────────────────────────────────────
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
        role: roleResult.value?.data?.role ?? null,
        loading: authLoading || roleResult.loading,
        error: authError ?? roleResult.error?.message ?? null,
        login,
        loginState,
        signup,
        signupState,
        logout,
    };
};