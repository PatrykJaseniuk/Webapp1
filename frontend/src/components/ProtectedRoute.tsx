'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loading } from './Loading';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string;
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
    const { user, role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        !loading && !user && router.push('/login');
        !loading && requiredRole && role !== requiredRole && router.push('/access-denied');
    }, [user, role, loading, requiredRole, router]);

    return (
        loading ? <Loading /> :
            !user ? null :
                requiredRole && role !== requiredRole ? null :
                    <>{children}</>
    );
};
