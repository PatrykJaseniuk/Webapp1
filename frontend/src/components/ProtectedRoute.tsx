'use client';
<<<<<<< HEAD
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loading } from './Loading';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string;
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
=======

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from './Loading';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
>>>>>>> LLM(claude-haiku-4-5)
    const { user, role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
<<<<<<< HEAD
        !loading && !user && router.push('/login');
        !loading && requiredRole && role !== requiredRole && router.push('/access-denied');
    }, [user, role, loading, requiredRole, router]);

    return (
        loading ? <Loading /> :
            !user ? null :
                requiredRole && role !== requiredRole ? null :
                    <>{children}</>
    );
=======
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
>>>>>>> LLM(claude-haiku-4-5)
};
