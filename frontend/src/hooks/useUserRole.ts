'use client';
import { useAsync } from 'react-use';
import { database } from '@/api/database';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
    const { user, loading: authLoading } = useAuth();

    const state = useAsync(async () => {
        return user
            ? await database.from('user_roles').select('role').eq('user_id', user.id).single()
            : { data: null, error: null };
    }, [user?.id]);

    return {
        role: (state.value?.data?.role as string) ?? null,
        loading: authLoading || state.loading,
        error: state.error ?? state.value?.error ?? null,
    };
};
