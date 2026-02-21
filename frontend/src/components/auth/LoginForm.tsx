'use client';
import { useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from '@/routes/useNavigate';
import { routes, ROLE_REDIRECTS } from '@/routes';
import { useUserRole } from '@/hooks/useUserRole';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import styles from '@/components/styles/auth.module.css';

export const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loginState, isAuthenticated } = useAuth();
    const { role, loading: roleLoading } = useUserRole();
    const navigate = useNavigate();

    // Redirect if already authenticated
    const shouldRedirect = isAuthenticated && role && ROLE_REDIRECTS[role];
    shouldRedirect && navigate(ROLE_REDIRECTS[role]);

    return (
        <div className={styles.authContainer}>
            <form
                className={styles.authForm}
                onSubmit={(e) => {
                    e.preventDefault();
                    login(email, password).then((result) => {
                        !result?.error && roleLoading;
                    });
                }}
            >
                <h1 className={styles.authTitle}>Logowanie</h1>

                {loginState.error && <ErrorBanner msg={loginState.error.message} />}
                {loginState.value?.error && <ErrorBanner msg={loginState.value.error.message} />}

                <div className={styles.authField}>
                    <label htmlFor="email" className={styles.authLabel}>Email</label>
                    <input
                        id="email"
                        type="email"
                        className={styles.authInput}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className={styles.authField}>
                    <label htmlFor="password" className={styles.authLabel}>Hasło</label>
                    <input
                        id="password"
                        type="password"
                        className={styles.authInput}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className={styles.authSubmit}
                    disabled={loginState.loading}
                >
                    {loginState.loading ? <Spinner /> : 'Zaloguj się'}
                </button>

                <p className={styles.authFooter}>
                    Nie masz konta?{' '}
                    <Link href={routes.signup()}>Zarejestruj się</Link>
                </p>
            </form>
        </div>
    );
};
