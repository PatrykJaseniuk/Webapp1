'use client';
import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from '@/routes/useNavigate';
import { routes, ROLE_REDIRECTS } from '@/routes';
import { Spinner } from '@/components/shared/Spinner';

export default function HomePage() {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const { role, loading: roleLoading } = useUserRole();
    const navigate = useNavigate();

    // Redirect authenticated users to their dashboard
    const redirectPath = role ? ROLE_REDIRECTS[role] : undefined;
    isAuthenticated && !roleLoading && redirectPath && navigate(redirectPath);

    return (
        authLoading || roleLoading ? <Spinner /> :
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
                <h1>Webapp1</h1>
                <p>System zarządzania nieruchomościami</p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href={routes.login()} style={{ padding: '0.5rem 1.5rem', background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius)', textDecoration: 'none' }}>
                        Zaloguj się
                    </Link>
                    <Link href={routes.signup()} style={{ padding: '0.5rem 1.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', textDecoration: 'none' }}>
                        Zarejestruj się
                    </Link>
                </div>
            </div>
    );
}
