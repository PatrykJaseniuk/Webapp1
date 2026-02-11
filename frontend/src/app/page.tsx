'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Spinner } from '@/components/shared/Spinner';

const ROLE_REDIRECTS: Record<string, string> = {
    tenant: '/tenant/dashboard',
    landlord: '/landlord',
    admin: '/admin/users',
};

export default function Page() {
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const { role, loading: roleLoading } = useUserRole();

    useEffect(() => {
        isAuthenticated && role && router.push(ROLE_REDIRECTS[role] ?? '/');
    }, [isAuthenticated, role, router]);

    return (
        authLoading || roleLoading ? <Spinner /> :
            isAuthenticated ? <Spinner /> :
                <div>
                    <h1>Rental Management System</h1>
                    <p>System zarządzania wynajmem nieruchomości</p>
                    <nav>
                        <Link href="/login">Zaloguj się</Link>
                        <Link href="/signup">Zarejestruj się</Link>
                    </nav>
                </div>
    );
}
