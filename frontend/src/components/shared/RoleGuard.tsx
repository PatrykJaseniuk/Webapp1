'use client';
import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { routes } from '@/routes';
import { Spinner } from '@/components/shared/Spinner';
import styles from '@/components/styles/shared.module.css';

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
                <div className={styles.guardContainer}>
                    <h2>Wymagane logowanie</h2>
                    <Link href={routes.login()} className={styles.buttonPrimary}>
                        Przejdź do logowania
                    </Link>
                </div>
            ) :
                !(role && allowedRoles.includes(role)) ? (
                    <div className={styles.guardContainer}>
                        <h2>Brak dostępu</h2>
                        <p>Nie masz uprawnień do tej strony.</p>
                        <Link href={routes.home()} className={styles.buttonPrimary}>
                            Strona główna
                        </Link>
                    </div>
                ) :
                    <>{children}</>
    );
};
