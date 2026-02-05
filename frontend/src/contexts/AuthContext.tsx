'use client';
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