'use client';

import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/shared/Sidebar';

import styles from './AppLayout.module.css';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
    const { user, logout } = useAuth();

    return (
        <div className={styles.layout}>
            <header className={styles.header}>
                <span className={styles.title}>Rental Management System</span>
                <div className={styles.userSection}>
                    <span className={styles.userEmail}>{user?.email ?? ''}</span>
                    <button className={styles.logoutButton} onClick={logout}>Wyloguj</button>
                </div>
            </header>
            <div className={styles.content}>
                <aside className={styles.sidebar}>
                    <Sidebar />
                </aside>
                <main className={styles.main}>{children}</main>
            </div>
        </div>
    );
};
