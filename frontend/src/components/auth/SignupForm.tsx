'use client';

import { useState } from 'react';
import Link from 'next/link';

import { routes } from '@/routes';
import { useAuth } from '@/hooks/useAuth';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

import styles from './AuthForm.module.css';

export const SignupForm = () => {
    const { signup, signupState } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [validationError, setValidationError] = useState('');

    const isSuccess = !!signupState.value?.data && !signupState.value?.error;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError('');

        password !== confirmPassword
            ? setValidationError('Hasła nie są identyczne.')
            : signup(email, password);
    };

    return (
        isSuccess ? (
            <div className={styles.successContainer}>
                <h1 className={styles.successTitle}>Rejestracja zakończona</h1>
                <p className={styles.successText}>Sprawdź swoją skrzynkę e-mail, aby potwierdzić konto.</p>
                <Link className={styles.successLink} href={routes.login()}>Przejdź do logowania</Link>
            </div>
        ) :
            <div className={styles.container}>
                <h1 className={styles.title}>Rejestracja</h1>

                {validationError && <ErrorBanner msg={validationError} />}
                {signupState.error && <ErrorBanner msg={signupState.error.message} />}
                {signupState.value?.error && <ErrorBanner msg={signupState.value.error.message} />}

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
                            autoComplete="new-password"
                            minLength={6}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="confirmPassword">Potwierdź hasło</label>
                        <input
                            className={styles.input}
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            minLength={6}
                        />
                    </div>

                    <button className={styles.button} type="submit" disabled={signupState.loading}>
                        {signupState.loading ? 'Rejestracja...' : 'Zarejestruj się'}
                    </button>
                </form>

                <p className={styles.link}>
                    Masz już konto? <Link href={routes.login()}>Zaloguj się</Link>
                </p>
            </div>
    );
};
