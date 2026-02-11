'use client';

import { useAsync } from 'react-use';

import { database } from '@/api/database';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
    const { user } = useAuth();

    const state = useAsync(async () => {
        const userId = user?.id;
        return userId
            ? database
                .from('user_roles')
                .select('role')
                .eq('user_id', userId)
                .single()
                .then(({ data, error }) => ({ role: data?.role ?? null, error }))
            : { role: null, error: null };
    }, [user?.id]);

    return {
        role: state.value?.role ?? null,
        loading: state.loading,
        error: state.error ?? state.value?.error ?? null,
    };
};
