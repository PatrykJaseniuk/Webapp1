'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { database } from '@/api/database';
import { Database } from '@/api/database.types';

interface AuthContextType {
    user: any | null;
    role: 'tenant' | 'landlord' | 'admin' | null;
    loading: boolean;
    error: string | null;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signUp: (email: string, password: string, role: 'tenant' | 'landlord') => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<'tenant' | 'landlord' | 'admin' | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load auth state on mount
    useEffect(() => {
        const initAuth = async () => {
            const { data: { user: authUser }, error: authError } = await database.auth.getUser();

            if (authError) {
                setError(authError.message);
                setLoading(false);
                return;
            }

            if (authUser) {
                setUser(authUser);

                // Fetch user role from database
                const { data: roleData, error: roleError } = await database
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', authUser.id)
                    .single();

                if (roleError) {
                    console.error('Error fetching user role:', roleError);
                } else {
                    setRole((roleData?.role as any) ?? null);
                }
            }

            setLoading(false);
        };

        initAuth();
    }, []);

    const value = {
        user,
        role,
        loading,
        error,
        signIn: async (email: string, password: string) => {
            setError(null);
            const result = await database.auth.signInWithPassword({ email, password });

            if (result.error) {
                setError(result.error.message);
                return { error: result.error.message };
            }

            setUser(result.data.user);

            // Fetch user role
            const { data: roleData, error: roleError } = await database
                .from('user_roles')
                .select('role')
                .eq('user_id', result.data.user?.id)
                .single();

            if (!roleError && roleData) {
                setRole((roleData.role as any) ?? null);
            }

            return { error: null };
        },
        signUp: async (email: string, password: string, role: 'tenant' | 'landlord') => {
            setError(null);
            const authResult = await database.auth.signUp({ email, password });

            if (authResult.error) {
                setError(authResult.error.message);
                return { error: authResult.error.message };
            }

            const userId = authResult.data.user?.id;

            if (!userId) {
                const msg = 'User ID not available after signup';
                setError(msg);
                return { error: msg };
            }

            // Create user_roles entry
            const roleResult = await database.from('user_roles').insert({
                user_id: userId,
                role,
            });

            if (roleResult.error) {
                setError(roleResult.error.message);
                return { error: roleResult.error.message };
            }

            setUser(authResult.data.user);
            setRole(role);
            return { error: null };
        },
        signOut: async () => {
            await database.auth.signOut();
            setUser(null);
            setRole(null);
            setError(null);
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
