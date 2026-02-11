'use client';

import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/shared/Sidebar';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
    const { user, logout } = useAuth();

    return (
        <div>
            <header>
                <span>Rental Management System</span>
                <div>
                    <span>{user?.email ?? ''}</span>
                    <button onClick={logout}>Wyloguj</button>
                </div>
            </header>
            <div>
                <Sidebar />
                <main>{children}</main>
            </div>
        </div>
    );
};
