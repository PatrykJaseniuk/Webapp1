'use client';
import Link from 'next/link';

import { useAuth } from '@/api/useAuth';
import { routes } from '@/api/routes/appRoutes';
import { Spinner } from '@/components/coreComponents/Spinner';
import styles from '@/components/styles/appShell.module.css';

interface RoleGuardProps {
    allowedRoles: string[];
    children: React.ReactNode;
}

export const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
    const { isAuthenticated, role, loading } = useAuth();

    return (
        loading ? <Spinner /> :
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
