'use client';
import { useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/api/useAuth';
// import { useNavigate } from '@/routes/useNavigate';
import { routes } from '@/api/routes/appRoutes';
import { Spinner } from '@/components/coreComponents/Spinner';
import { ErrorBanner } from '@/components/coreComponents/ErrorBanner';
import styles from '@/components/styles/auth.module.css';
import { useRouter } from 'next/navigation';

export const SignupForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { signup, signupState } = useAuth();
    const router = useRouter();

    const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

    return (
        <div className={styles.authContainer}>
            <form
                className={styles.authForm}
                onSubmit={(e) => {
                    e.preventDefault();
                    !passwordMismatch && signup(email, password).then((result) => {
                        !result?.error && router.push(routes.login());
                    });
                }}
            >
                <h1 className={styles.authTitle}>Rejestracja</h1>

                {signupState.error && <ErrorBanner msg={signupState.error.message} />}
                {signupState.value?.error && <ErrorBanner msg={signupState.value.error.message} />}

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
                        minLength={6}
                    />
                </div>

                <div className={styles.authField}>
                    <label htmlFor="confirmPassword" className={styles.authLabel}>Potwierdź hasło</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        className={styles.authInput}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    {passwordMismatch && (
                        <span className={styles.authError} role="alert">Hasła nie są zgodne</span>
                    )}
                </div>

                <button
                    type="submit"
                    className={styles.authSubmit}
                    disabled={signupState.loading || passwordMismatch}
                >
                    {signupState.loading ? <Spinner /> : 'Zarejestruj się'}
                </button>

                <p className={styles.authFooter}>
                    Masz już konto?{' '}
                    <Link href={routes.login()}>Zaloguj się</Link>
                </p>
            </form>
        </div>
    );
};
