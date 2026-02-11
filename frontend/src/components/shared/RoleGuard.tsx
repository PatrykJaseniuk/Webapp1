'use client';

import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Spinner } from '@/components/shared/Spinner';

interface RoleGuardProps {
    allowedRoles: string[];
    children: React.ReactNode;
}

export const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const { role, loading: roleLoading } = useUserRole();

    return (
        authLoading || roleLoading ? <Spinner /> :
            !isAuthenticated ? (
                <div>
                    <h2>Wymagane logowanie</h2>
                    <p>Zaloguj się, aby uzyskać dostęp do tej strony.</p>
                    <Link href="/login">Przejdź do logowania</Link>
                </div>
            ) :
                !role || !allowedRoles.includes(role) ? (
                    <div>
                        <h2>Brak dostępu</h2>
                        <p>Nie masz uprawnień do wyświetlenia tej strony.</p>
                        <Link href="/">Powrót do strony głównej</Link>
                    </div>
                ) :
                    <>{children}</>
    );
};
