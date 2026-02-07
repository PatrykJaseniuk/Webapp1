'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from './Loading';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { user, role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const redirect = () => {
            !loading && !user ? router.push('/login') :
                !loading && allowedRoles && role && !allowedRoles.includes(role) ? router.push('/access-denied') :
                    null;
        };

        redirect();
    }, [user, role, loading, allowedRoles, router]);

    return loading ? <Loading message="Checking authentication..." /> :
        !user ? <Loading message="Redirecting to login..." /> :
            allowedRoles && role && !allowedRoles.includes(role) ? <Loading message="Access denied..." /> :
                <>{children}</>;
};
