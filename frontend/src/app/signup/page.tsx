'use client';

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
