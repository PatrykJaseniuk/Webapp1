'use client';

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
