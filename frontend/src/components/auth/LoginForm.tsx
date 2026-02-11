'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

import styles from './LoginForm.module.css';

const ROLE_REDIRECTS: Record<string, string> = {
    tenant: '/tenant/dashboard',
    landlord: '/landlord/dashboard',
    admin: '/admin/users',
};

export const LoginForm = () => {
    const router = useRouter();
    const { isAuthenticated, login, loginState } = useAuth();
    const { role } = useUserRole();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        isAuthenticated && role && router.push(ROLE_REDIRECTS[role] ?? '/');
    }, [isAuthenticated, role, router]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(email, password);
    };

    return (
        isAuthenticated ? <Spinner /> :
            <div className={styles.container}>
                <h1 className={styles.title}>Logowanie</h1>

                {loginState.error && <ErrorBanner msg={loginState.error.message} />}
                {loginState.value?.error && <ErrorBanner msg={loginState.value.error.message} />}

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="email">Email</label>
                        <input
                            className={styles.input}
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            placeholder="jan@example.com"
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="password">Hasło</label>
                        <input
                            className={styles.input}
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            minLength={6}
                        />
                    </div>

                    <button className={styles.button} type="submit" disabled={loginState.loading}>
                        {loginState.loading ? 'Logowanie...' : 'Zaloguj się'}
                    </button>
                </form>

                <p className={styles.link}>
                    Nie masz konta? <Link href="/signup">Zarejestruj się</Link>
                </p>
            </div>
    );
};
