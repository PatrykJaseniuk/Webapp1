'use client';

import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Spinner } from '@/components/shared/Spinner';

import styles from './RoleGuard.module.css';

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
                <div className={styles.container}>
                    <h2 className={styles.title}>Wymagane logowanie</h2>
                    <p className={styles.message}>Zaloguj się, aby uzyskać dostęp do tej strony.</p>
                    <Link className={styles.link} href="/login">Przejdź do logowania</Link>
                </div>
            ) :
                !(role && allowedRoles.includes(role)) ? (
                    <div className={styles.container}>
                        <h2 className={styles.title}>Brak dostępu</h2>
                        <p className={styles.message}>Nie masz uprawnień do wyświetlenia tej strony.</p>
                        <Link className={styles.link} href="/">Powrót do strony głównej</Link>
                        <p>rola: {role} includes {allowedRoles}</p>
                    </div>
                ) :
                    <>{children}</>
    );
};
