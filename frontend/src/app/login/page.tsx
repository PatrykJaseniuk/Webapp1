'use client';

import Link from 'next/link';
import { LoginForm } from '@/forms/LoginForm';
import { Card } from '@/components/Card';
import styles from './page.module.css';

export default function LoginPage() {
    return (
        <div className={styles.container}>
            <Card title="Sign In">
                <LoginForm />
                <div className={styles.footer}>
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className={styles.link}>
                        Sign up
                    </Link>
                </div>
            </Card>
        </div>
    );
}
