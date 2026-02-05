'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAsyncFn } from 'react-use';
import { useAuth } from '@/contexts/AuthContext';
import { FormInput } from '@/components/FormInput';
import { Button } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { ErrorBanner } from '@/components/ErrorBanner';
import styles from './login.module.css';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signIn } = useAuth();
    const router = useRouter();

    const [loginState, handleLogin] = useAsyncFn(async () => {
        if (!isValidEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        if (!password) {
            throw new Error('Please enter your password');
        }

        const result = await signIn(email, password);
        if (result.error) {
            throw new Error(result.error.message);
        }

        const msg= !isValidEmail(email) ? 'email error'  :
        !password ? 'no password': ''
        
        msg == '' &&
        await signIn(email)
        
        


        router.push('/');
    }, [email, password, signIn, router]);

    const emailError = email && !isValidEmail(email) ? 'Please enter a valid email address' : undefined;
    const passwordError = !password ? 'Password is required' : undefined;

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                <h1 className={styles.title}>Sign In</h1>

                {loginState.error && (
                    <ErrorBanner message={loginState.error.message} />
                )}

                <form
                    className={styles.form}
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleLogin();
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
                        placeholder="Enter your password"
                        required
                        error={passwordError}
                    />

                    <Button
                        label={loginState.loading ? 'Signing In...' : 'Sign In'}
                        type="submit"
                        disabled={loginState.loading || !!emailError || !!passwordError}
                    />
                </form>

                <p className={styles.signupLink}>
                    Don't have an account?{' '}
                    <a href="/signup" className={styles.link}>
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    );
}