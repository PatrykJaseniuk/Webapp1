'use client';
<<<<<<< HEAD
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAsyncFn } from 'react-use';
import { useAuth } from '@/contexts/AuthContext';
import { FormInput } from '@/components/FormInput';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import styles from './signup.module.css';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPassword = (password: string) => password.length >= 8;

const roleOptions = [
    { value: 'landlord', label: 'Landlord' },
    { value: 'tenant', label: 'Tenant' },
];

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('');
    const { signUp } = useAuth();
    const router = useRouter();

    const [signupState, handleSignup] = useAsyncFn(async () => {
        if (!isValidEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        if (!isValidPassword(password)) {
            throw new Error('Password must be at least 8 characters long');
        }
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }
        if (!role) {
            throw new Error('Please select a role');
        }

        const result = await signUp(email, password, role);
        if (result.error) {
            throw new Error(result.error.message);
        }

        router.push('/login');
    }, [email, password, confirmPassword, role, signUp, router]);

    const emailError = email && !isValidEmail(email) ? 'Please enter a valid email address' : undefined;
    const passwordError = password && !isValidPassword(password) ? 'Password must be at least 8 characters' : undefined;
    const confirmPasswordError = confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined;
    const roleError = !role ? 'Please select a role' : undefined;

    return (
        <div className={styles.container}>
            <div className={styles.signupCard}>
                <h1 className={styles.title}>Create Account</h1>

                {signupState.error && (
                    <ErrorBanner message={signupState.error.message} />
                )}

                <form
                    className={styles.form}
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSignup();
                    }}
                >
                    <FormInput
                        label="Email"
                        type="email"
                        value={email}
                        onChange={setEmail}
                        placeholder="Enter your email"
                        required
                        error={emailError}
                    />

                    <FormInput
                        label="Password"
                        type="password"
                        value={password}
                        onChange={setPassword}
                        placeholder="Enter your password (min 8 characters)"
                        required
                        error={passwordError}
                    />

                    <FormInput
                        label="Confirm Password"
                        type="password"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="Confirm your password"
                        required
                        error={confirmPasswordError}
                    />

                    <FormInput
                        label="Role"
                        type="select"
                        value={role}
                        onChange={setRole}
                        placeholder="Select your role"
                        required
                        error={roleError}
                        options={roleOptions}
                    />

                    <Button
                        label={signupState.loading ? 'Creating Account...' : 'Create Account'}
                        type="submit"
                        disabled={signupState.loading || !!emailError || !!passwordError || !!confirmPasswordError || !!roleError}
                    />
                </form>

                <p className={styles.loginLink}>
                    Already have an account?{' '}
                    <a href="/login" className={styles.link}>
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
}
=======

import Link from 'next/link';
import { SignupForm } from '@/forms/SignupForm';
import { Card } from '@/components/Card';
import styles from './page.module.css';

export default function SignupPage() {
    return (
        <div className={styles.container}>
            <Card title="Create Account">
                <SignupForm />
                <div className={styles.footer}>
                    Already have an account?{' '}
                    <Link href="/login" className={styles.link}>
                        Sign in
                    </Link>
                </div>
            </Card>
        </div>
    );
}
>>>>>>> LLM(claude-haiku-4-5)
