'use client';

import { useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

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
            <div>
                <h1>Rejestracja zakończona</h1>
                <p>Sprawdź swoją skrzynkę e-mail, aby potwierdzić konto.</p>
                <Link href="/login">Przejdź do logowania</Link>
            </div>
        ) :
            <div>
                <h1>Rejestracja</h1>

                {validationError && <ErrorBanner msg={validationError} />}
                {signupState.error && <ErrorBanner msg={signupState.error.message} />}
                {signupState.value?.error && <ErrorBanner msg={signupState.value.error.message} />}

                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            placeholder="jan@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password">Hasło</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword">Potwierdź hasło</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            minLength={6}
                        />
                    </div>

                    <button type="submit" disabled={signupState.loading}>
                        {signupState.loading ? 'Rejestracja...' : 'Zarejestruj się'}
                    </button>
                </form>

                <p>
                    Masz już konto? <Link href="/login">Zaloguj się</Link>
                </p>
            </div>
    );
};
