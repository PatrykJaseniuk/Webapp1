'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAsyncFn } from 'react-use';
import { useAuth } from '@/contexts/AuthContext';
import { FormInput } from '@/components/FormInput';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import styles from './LoginForm.module.css';

export const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signIn } = useAuth();
    const router = useRouter();

    const [state, handleSubmit] = useAsyncFn(async () => {
        const result = await signIn(email, password);
        console.log(result)
        console.log(state)
        result.success && router.push('/');
        return result;
    }, [email, password, signIn, router]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit();
    };

    return (
        <form onSubmit={onSubmit} className={styles.form}>
            {state.value?.error && <ErrorBanner msg={state.value.error ?? 'Login failed'} />}

            <FormInput
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="your@email.com"
                required
                disabled={state.loading}
            />

            <FormInput
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                required
                disabled={state.loading}
            />

            <Button
                type="submit"
                label={state.loading ? 'Signing in...' : 'Sign In'}
                disabled={state.loading || !email || !password}
                variant="primary"
            />
        </form>
    );
};
