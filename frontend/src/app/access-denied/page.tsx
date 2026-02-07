'use client';
<<<<<<< HEAD
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import styles from './access-denied.module.css';

export default function AccessDeniedPage() {
    const { signOut } = useAuth();

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Access Denied</h1>
                <p className={styles.message}>
                    You don't have permission to access this page.
                </p>
                <div className={styles.actions}>
                    <Button
                        label="Go Home"
                        onClick={() => window.location.href = '/'}
                    />
                    <Button
                        label="Sign Out"
                        variant="secondary"
                        onClick={signOut}
                    />
                </div>
            </div>
        </div>
    );
}
=======

import Link from 'next/link';
import { Card } from '@/components/Card';
import styles from './page.module.css';

export default function AccessDeniedPage() {
    return (
        <div className={styles.container}>
            <Card>
                <div className={styles.content}>
                    <h1 className={styles.title}>🚫 Access Denied</h1>
                    <p className={styles.message}>
                        You don&apos;t have permission to access this page.
                    </p>
                    <Link href="/" className={styles.link}>
                        Go to Dashboard
                    </Link>
                </div>
            </Card>
        </div>
    );
}
>>>>>>> LLM(claude-haiku-4-5)
