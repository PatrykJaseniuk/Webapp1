'use client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from '@/routes/useNavigate';
import { routes } from '@/routes';
import { Sidebar } from '@/components/shared/Sidebar';
import styles from '@/components/styles/shared.module.css';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div className={styles.appLayout}>
            <Sidebar />
            <div className={styles.appMain}>
                <header className={styles.appHeader}>
                    <span className={styles.appHeaderUser}>{user?.email ?? ''}</span>
                    <button
                        className={styles.buttonSecondary}
                        onClick={() => logout().then(() => navigate(routes.login()))}
                    >
                        Wyloguj
                    </button>
                </header>
                <main className={styles.appContent}>{children}</main>
            </div>
        </div>
    );
};
