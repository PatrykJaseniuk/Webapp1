'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAsyncFn } from 'react-use';
import { useAuth } from '@/contexts/AuthContext';
import { FormInput } from '@/components/FormInput';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import styles from './SignupForm.module.css';

export const SignupForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // const [role, setRole] = useState('');
    const { signUp } = useAuth();
    const router = useRouter();

    // const roleOptions = [
    //     { value: 'tenant', label: 'Tenant' },
    //     { value: 'landlord', label: 'Landlord' },
    //     { value: 'admin', label: 'Admin' },
    // ];

    const [state, handleSubmit] = useAsyncFn(async () => {
        const result = await signUp(email, password);
        result.success && router.push('/login');
        return result
    }, [email, password, signUp, router]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit();
    };

    return (
        <form onSubmit={onSubmit} className={styles.form}>
            {state.value?.error &&
                <ErrorBanner msg={state.value.error ?? 'Signup failed'} />}

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
                placeholder="Create a password (min 6 characters)"
                required
                disabled={state.loading}
            />


            <Button
                type="submit"
                label={state.loading ? 'Creating account...' : 'Sign Up'}
                disabled={state.loading || !email || !password}
                variant="primary"
            />
        </form>
    );
};
