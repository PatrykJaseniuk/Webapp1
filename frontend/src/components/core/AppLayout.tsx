'use client';
import { useAuth } from '@/api/useAuth';
import { routes } from '@/api/routes/appRoutes';
import { Sidebar } from '@/components/core/Sidebar';
import styles from '@/components/styles/appShell.module.css';
import { useRouter } from 'next/navigation';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
    const { user, logout } = useAuth();
    const router = useRouter();

    return (
        <div className={styles.appLayout}>
            <Sidebar />
            <div className={styles.appMain}>
                <header className={styles.appHeader}>
                    <span className={styles.appHeaderUser}>{user?.email ?? ''}</span>
                    <button
                        className={styles.buttonSecondary}
                        onClick={() => logout().then(() => router.push(routes.login()))}
                    >
                        Wyloguj
                    </button>
                </header>
                <main className={styles.appContent}>{children}</main>
            </div>
        </div>
    );
};
